import React, { Component } from 'react'
import { ethers } from 'ethers'

import { ConnectWallet } from '../components/ConnectWallet'

import auctionAddress from '../contract/RPS-contract-address.json'
import auctionArtifact from '../contract/RPS.json'

const HARDHAT_NETWORK_ID = '97'
const ERROR_CODE_TX_REJECTED_BY_USER = 4001

export default class extends Component {
    constructor(props) {
        super(props)

        this.initialState = {
            selectedAccount: null,
            txBeingSent: null,
            networkError: null,
            transactionError: null,
            balance: null,
            currentPrice: "1",
            command: 3,
            gameEnd: false,
            state: null,
            history: false,
            histiryState: null,
        }

        this.state = this.initialState
        this.onChangeValue = this.onChangeValue.bind(this);
    }

    onChangeValue(event) {
        this.state.command = event.target.value;
    }

    _connectWallet = async () => {
        if (window.ethereum === undefined) {
            this.setState({
                networkError: 'Please install Metamask!'
            })
            return
        }
        console.log(window.ethereum)
        const [selectedAddress] = await window.ethereum.request({
            method: 'eth_requestAccounts'
        })

        if (!this._checkNetwork()) { return }

        this._initialize(selectedAddress)

        window.ethereum.on('accountsChanged', ([newAddress]) => {
            if (newAddress === undefined) {
                return this._resetState()
            }

            this.rps.off("Game", this._listner)
            this._initialize(newAddress)
        })

        window.ethereum.on('chainChanged', ([networkId]) => {
            this._resetState()
        })
    }

    _listner = (a, b, c, d, e, event) => {
        if (d.toLowerCase() != this.state.selectedAccount) return

        if (c == "0") {
            this.setState({ state: "WIN" })
        } else if (c == "1") {
            this.setState({ state: "DEFEAT" })
        } else {
            this.setState({ state: "DRAW" })
        }
    }

    async _initialize(selectedAddress) {
        this._provider = new ethers.providers.Web3Provider(window.ethereum)

        this.rps = new ethers.Contract(
            auctionAddress.RPS,
            auctionArtifact.abi,
            this._provider.getSigner(0)
        )

        this.rps.on("Game", this._listner)

        this.setState({
            selectedAccount: selectedAddress
        }, async () => {
            await this.updateBalance()
        })

    }

    async updateBalance() {
        const newBalance = (await this._provider.getBalance(
            this.state.selectedAccount
        )).toString()

        this.setState({
            balance: newBalance
        })
    }

    _resetState() {
        this.setState(this.initialState)
    }

    _checkNetwork() {
        if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) { return true }

        this.setState({
            networkError: 'Please connect to localhost:8545'
        })

        return false
    }

    _dismissNetworkError = () => {
        this.setState({
            networkError: null
        })
    }

    play = async () => {
        try {

            const tx = await this.rps.play(this.state.command, {
                value: ethers.utils.parseEther(this.state.currentPrice)/1000,
                gasLimit: 100000
            })

            await tx.wait()

            this.setState({ gameEnd: true })
            this.history()

        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return }

            console.error(error)

            this.setState({
                transactionError: error
            })
        } finally {
            this.setState({
                txBeingSent: null
            })
            await this.updateBalance()
        }

    }

    newGame = () => {
        this.setState({ gameEnd: false })
    }

    history = async () => {
        this.setState({ history: !this.state.history })
        const i = await this.rps.getHistory()
        let out = []
        console.log(i)
        i.slice().reverse().forEach(element => {

            const state = element.state;
            let money;
            let out_state;
            console.log(state)
            if (state == 0) {
                out_state = "WIN"
                money = ethers.utils.formatEther(element.money);
            } else if (state == 1) {
                out_state = "DEFEAT"
                money = 0;
            } else if (state == 2) {
                out_state = "DRAW"
                money = ethers.utils.formatEther(element.money) / 2;
            }
            out.push(<p>{out_state} {money} tBNB</p>)
        });


        this.setState({ histiryState: <div>{out}</div> })

        

    }

    render() {
        if (!this.state.selectedAccount) {
            return <ConnectWallet
                connectWallet={this._connectWallet}
                networkError={this.state.networkError}
                dismiss={this._dismissNetworkError}
            />
        }

        return (
            <>
                {this.state.balance &&
                    <p>Your balance: {ethers.utils.formatEther(this.state.balance)} tBNB</p>}
                {this.state.balance && <div>
                    <div onChange={this.onChangeValue}>
                        <input type="radio" value="0" name="gender" /> Rock
                        <input type="radio" value="1" name="gender" /> Paper
                        <input type="radio" value="2" name="gender" /> Scissors
                    </div>
                    <div>
                        {!this.state.gameEnd && <button onClick={this.play}>Play</button>}
                        {this.state.gameEnd && <div>
                            <p>{this.state.state}</p>
                            <button onClick={this.newGame}>NewGame</button>
                        </div>}
                    </div>
                    <div>
                        <button onClick={this.history}>History</button>
                        {this.state.history && this.state.histiryState}
                    </div>
                </div>}

            </>
        )
    }
}