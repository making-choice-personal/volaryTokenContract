const Token = artifacts.require("Volary");
const { expect, assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");

describe('Volary Token', (accounts) => {
    let token, balance;
    let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    before(async function () {
        accounts = await web3.eth.getAccounts();

        token = await Token.new();
    });

    it('has correct name', async () => {
        const name = await token.name();
        assert.equal(name, 'Volary');
    })

    it('has correct symbol', async () => {
        const symbol = await token.symbol();
        assert.equal(symbol, 'VLRY');
    })

    it('has correct decimals', async () => {
        const decimals = await token.decimals();
        assert.equal(decimals.toNumber(), 18);
    })

    it('has correct owner', async () => {
        const owner = await token.owner();
        assert.equal(owner, accounts[0]);
    })
    
    it('has correct total supply', async () => {
        const supply = await token.totalSupply();
        assert.equal(supply, 1000000000 * 10 ** 18 );
    })

    it('total supply minted to owner', async () => {
        const supply = await token.totalSupply();
        const owner=await token.owner();
        const ownerBalance=await token.balanceOf(owner);
        assert.equal(parseInt(supply), parseInt(ownerBalance));
    })

    it('approve,transferFrom and burnFrom works', async () => {
        await truffleAssert.reverts(token.approve(ZERO_ADDRESS, 10000 *10000),
        "VM Exception while processing transaction: reverted with reason string 'ERC20: approve to the zero address'");
       // await truffleAssert.reverts(token.approve(accounts[1],0),
       // "VM Exception while processing transaction: reverted with reason string 'ERC20: approved amount cant be zero'");

       await token.approve(accounts[1],100);
       assert.equal(await token.allowance(accounts[0],accounts[1]),100);

       await token.transferFrom(accounts[0],accounts[2],50,{from : accounts[1]});

       assert.equal(await token.balanceOf(accounts[2]),50);
       assert.equal(await token.allowance(accounts[0],accounts[1]),50);

       await truffleAssert.reverts(token.transferFrom(accounts[0],accounts[2],51,{from : accounts[1]}),"VM Exception while processing transaction: reverted with reason string 'ERC20: insufficient allowance")

       await token.transfer(accounts[1],100);
       assert.equal(await token.balanceOf(accounts[1]),100);
       //await truffleAssert.reverts(token.approve(accounts[0],10000,{from : accounts[1]}),
       // "VM Exception while processing transaction: reverted with reason string 'ERC20: approve to the zero address'");

       await token.transfer(accounts[3],100);
       balance=await token.balanceOf(accounts[3]);
       assert.equal(parseInt(balance),100);
       await token.approve(accounts[1],50,{from : accounts[3]});
       await token.burnFrom(accounts[3],25,{from : accounts[1]});
       balance=await token.balanceOf(accounts[3]);
       assert.equal(parseInt(balance),75);
       await truffleAssert.reverts(token.burnFrom(accounts[3],26,{from : accounts[1]}),"VM Exception while processing transaction: reverted with reason string 'ERC20: insufficient allowance")

       

    })

    it('transfer works', async () => {
        await truffleAssert.reverts(token.transfer(ZERO_ADDRESS, 10000 *10000),
        "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer to the zero address'");
       // await truffleAssert.reverts(token.transfer(accounts[1],0),
       //"VM Exception while processing transaction: reverted with reason string 'ERC20: transfered amount cant be zero'");

       await token.transfer(accounts[1],100);
       balance=await token.balanceOf(accounts[1])
       assert.equal(parseInt(balance),200);

       await truffleAssert.reverts(token.transfer(accounts[0],10000,{from : accounts[1]}),
        "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'");

    })

    it('burn works', async () => {

       await token.burn(25,{from : accounts[2]});
       balance=await token.balanceOf(accounts[2])
       assert.equal(parseInt(balance),25);
       
       await truffleAssert.reverts(token.burn(26,{from : accounts[2]}),
        "VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'");

    })

    it('mint works', async () => {
        let beforeBalance = await token.balanceOf(accounts[0])
        await token.mint(accounts[5],100)
        balance=await token.balanceOf(accounts[5]);
        assert.equal(parseInt(balance),100);
        let afterBalance= await token.balanceOf(accounts[0]);
        //assert.equal(parseInt(beforeBalance),parseInt(afterBalance));
        
        await truffleAssert.reverts(token.mint(accounts[5],26,{from : accounts[2]}),
         "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        balance=await token.balanceOf(accounts[0]);
        let sendValue=balance+10;
        
        //await truffleAssert.reverts(token.mint(accounts[5],sendValue.toString(),{from : accounts[0]}),
         //"VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
     })

     it('increase and decrease allownace works', async () => {

        await token.transfer(accounts[6],200);
        await token.increaseAllowance(accounts[7],100,{from : accounts[6]});
        assert.equal(await token.allowance(accounts[6],accounts[7]),100);

        //await truffleAssert.reverts(await token.increaseAllowance(accounts[7],201,{from : accounts[6]}),
         //"VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
         await token.decreaseAllowance(accounts[7],50,{from : accounts[6]});
         assert.equal(await token.allowance(accounts[6],accounts[7]),50);
         await truffleAssert.reverts(token.decreaseAllowance(accounts[7],51,{from : accounts[6]}),
        "VM Exception while processing transaction: reverted with reason string 'ERC20: decreased allowance below zero'");
       
     })

     it('pause and unpause', async () => {

        await token.pause();
        assert.equal(await token.paused(),true);
        await truffleAssert.reverts(token.mint(accounts[8],100),
        "VM Exception while processing transaction: reverted with reason string 'Pausable: paused'");

        
        await token.unpause();
        assert.equal(await token.paused(),false);
        await token.mint(accounts[8],100)
        balance=await token.balanceOf(accounts[8]);
        assert.equal(parseInt(balance),100);

        await truffleAssert.reverts(token.pause({from : accounts[1]}),
        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        await truffleAssert.reverts(token.unpause({from : accounts[1]}),
        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        
     })

     it('transferOwnership and renounce', async () => {

        await truffleAssert.reverts(token.transferOwnership(accounts[2],{from : accounts[1]}),
        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        await truffleAssert.reverts(token.renounceOwnership({from : accounts[1]}),
        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        await token.transferOwnership(accounts[1]);
        assert.equal(await token.owner(),accounts[1]);
        await token.renounceOwnership({from:accounts[1]})
        assert.equal(await token.owner(),ZERO_ADDRESS);
        
     })



    
});