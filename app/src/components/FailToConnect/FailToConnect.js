import React from 'react'

import './fail-to-connect.css'
import exitIcon from '../../assets/pic/exit-icon.png'
import errorIcon from '../../assets/pic/error-icon.png'
import { Connect } from '../../services/connect.wallet.service'

const FailToConnect = ({setActiveModal,chosenConnection}) => {

  const connectToWallet = async () => {
    setActiveModal('waitingToConnect')
    const res = await Connect(chosenConnection)
    if(res) setActiveModal('failToConnect')
  };

  return (
    <div className='fail-connect'>
        <div className='fail-connect-exit' onClick={()=>setActiveModal('welcome')}><img alt='' src={exitIcon}/></div>
        <div><img alt='' src={errorIcon}/></div>
        <div className='fail-connect-header'>Error connecting</div>
        <div className='fail-connect-text'>The connection attempt failed. Please click try again and follow the steps to connect in your wallet.</div>
        <div className='fail-connect-btn' onClick={connectToWallet}>Try Again</div>
        <div className='fail-connect-footer' onClick={()=>setActiveModal('connectModal')}>Back to wallet selection</div>
    </div>
  )
}

export default FailToConnect