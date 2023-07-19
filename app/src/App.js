import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllInfo, updateInfo } from './features/infoSlice';
import { ToastContainer, toast } from 'react-toastify';
import {
  fetchPlayers,
  newPlayer,
  removeAllPlayers,
  updatePlayer,
} from './features/playersSlice';
import { store } from './features/store';
import { addEvent } from './features/eventsSlice';
import abi from './contracts/abi.json';
import Web3 from 'web3';
import { CHAINS } from './connectors/chains';
import { useRef } from 'react';
import { Connect } from './services/connect.wallet.service';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Welcome from './pages/Welcome/Welcome';
import Map from './pages/Map/Map';
import Header from './components/Header/Header';
import Mint from './pages/Mint/Mint';
import Shop from './pages/Shop/Shop';
import Graveyard from './pages/Graveyard/Graveyard';
import Arena from './pages/Arena/Arena';
import Footer from './components/Footer/Footer';
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal';
import WaitingToConnect from './components/WaitingToConnect/WaitingToConnect';
import ErrorModal from './components/ErrorModal/ErrorModal';
import Overview from './pages/Overview/Overview';
import SubmittedModal from './components/SubmittedModal/SubmittedModal';
import PlayerDetails from './components/PlayerDetails/PlayerDetails';
import ConnectModal from './components/ConnectModal/ConnectModal';
import FailToConnect from './components/FailToConnect/FailToConnect';
import { selectAllDarkMode } from './features/darkModeSlice';

function App() {
  const [params, setParams] = useState({});
  const [error, setError] = useState({});
  const [activeModal, setActiveModal] = useState('');
  const [txHash, setTxHash] = useState('');
  const [chosenConnection, setChosenConnection] = useState('');
  const [isNotification, setIsNotification] = useState(true);
  const [balance, setBalance] = useState('');
  const [mintInfo, setMintInfo] = useState({ cost: '0', totalSupply: '0' });
  const { provider, accounts, chainId, isActive } = useWeb3React();
  const [isAudio, setIsAudio] = useState(false);
  const info = useSelector(selectAllInfo);
  const dispatch = useDispatch();
  const emitter = useRef();
  const isDarkMode = useSelector(selectAllDarkMode);

  useEffect(() => {
    if (!isActive) Connect('Network');
  }, []);

  useEffect(() => {
    if (!isActive) Connect('Network');
    startEventListener();
    getCost();
    getTotal();
    setBalance('');
    getUserBalance();
  }, [info]);

  useEffect(() => {
    setBalance('');
    getUserBalance();
  }, [accounts]);

  useEffect(() => {
    if (!isActive) Connect('Network');
    if (chainId === 137 || chainId === 5) {
      initInfo();
      dispatch(removeAllPlayers());
      store.dispatch(fetchPlayers(chainId));
    }
  }, [chainId]);

  const initInfo = () => {
    const web3 = new Web3(CHAINS[chainId].urls[0]);
    const web3ws = new Web3(
      new Web3.providers.WebsocketProvider(CHAINS[chainId].WSurls[0])
    );
    const contract = new web3.eth.Contract(
      abi.abi,
      CHAINS[chainId].contractAddress
    );
    const contractWS = new web3ws.eth.Contract(
      abi.abi,
      CHAINS[chainId].contractAddress
    );
    dispatch(
      updateInfo({
        web3,
        contract,
        contractWS,
        contractJSON: { address: CHAINS[chainId].contractAddress },
      })
    );
  };

  const confirmTransaction = async (params, desc) => {
    try {
      await info.web3.eth.estimateGas(params);
      setParams({ params, desc });
      setActiveModal('confirmationModal');
    } catch (err) {
      console.log(err, params);
      if (desc.action === 'Mint') {
        setActiveModal('confirmationModal');
        setParams({ params, desc });
      }
      return err;
    }
  };

  const sendTransaction = async () => {
    setActiveModal('waitingforConfirmation');
    try {
      const txHash = await provider.getSigner().sendTransaction(params.params);
      setTxHash(txHash);
      getUserBalance();
      setActiveModal('submittedModal');
      toast.promise(txHash.wait, {
        pending: {
          render() {
            return (
              <>
                <div>Pending transaction</div>
                <a
                  href={`https://polygonscan.com/tx/${txHash.hash}`}
                  style={{ color: 'orange', fontSize: '0.85em' }}
                  target="_blank"
                >
                  View on Polygonscan
                </a>
              </>
            );
          },
          closeButton: true,
        },
        success: {
          render() {
            return (
              <>
                <div>Transaction succeeded 👌</div>
                <a
                  href={`https://polygonscan.com/tx/${txHash.hash}`}
                  style={{ color: 'orange', fontSize: '0.85em' }}
                  target="_blank"
                >
                  View on Polygonscan
                </a>
              </>
            );
          },
        },
        error: 'Transaction failed 🤯',
      });
    } catch (err) {
      console.log(err);
      const errMsg = JSON.parse(JSON.stringify(err)).reason;
      setError(errMsg);
      setActiveModal('errorModal');
    }
  };

  const getUserBalance = async () => {
    if (accounts?.length !== 0 && accounts[0]) {
      try {
        const balance = await info.web3.eth.getBalance(accounts[0]);
        setBalance(Number(info.web3.utils.fromWei(balance)).toFixed(2));
      } catch (err) {
        console.log(err);
      }
    }
  };

  const getCost = async () => {
    const params = {
      to: info.contractJSON.address,
      data: info.contract.methods.cost().encodeABI(),
    };
    try {
      const result = await info.web3.eth.call(params);
      setMintInfo((prevState) => ({
        ...prevState,
        cost: info.web3.utils.hexToNumberString(
          Number(result) + 10000000000000000
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const getTotal = async () => {
    try {
      const result = await info.web3.eth.call({
        to: info.contractJSON.address,
        data: info.contract.methods.totalSupply().encodeABI(),
      });
      setMintInfo((prevState) => ({
        ...prevState,
        totalSupply: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      console.log(err);
    }
  };
  const startEventListener = () => {};
  useEffect(() => {
    let options = {
      filter: {
        value: [],
      },
      fromBlock: 'latest',
    };
    if (emitter.current) emitter.current.removeAllListeners('data');
    emitter.current = info.contractWS.events
      .allEvents(options)
      .on('data', (event) => eventAction(event));
    return () => {
      emitter.current.removeAllListeners('data');
    };
  }, [isNotification, info]);

  const eventAction = async (event) => {
    let currBlock = await info.web3.eth.getBlockNumber();
    while (event.blockNumber >= currBlock) {
      currBlock = await info.web3.eth.getBlockNumber();
    }
    switch (event.event) {
      case 'Attacked':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._eaterId,
          })
        );
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._eatenId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._eaterId} attacked player number #${event.returnValues._eatenId} ! 🤯 `,
          })
        );
        if (isNotification) {
          toast.info(
            `Player number #${event.returnValues._eaterId} attacked player number #${event.returnValues._eatenId} ! 🤯 `,
            { autoClose: 3000 }
          );
        }
        break;
      case 'Transfer':
        if (
          event.returnValues.from ===
          '0x0000000000000000000000000000000000000000'
        ) {
          await store.dispatch(
            newPlayer({
              contract: info.contract,
              playerId: event.returnValues.tokenId,
            })
          );
          dispatch(
            addEvent({
              time: Date.now(),
              txt: `Player number #${event.returnValues.tokenId} just joined the game! 🥳`,
            })
          );
          getCost();
          getTotal();
          if (isNotification) {
            toast.info(
              `Player number #${event.returnValues.tokenId} just joined the game! 🥳`,
              { autoClose: 3000 }
            );
          }
        } else {
          await store.dispatch(
            updatePlayer({
              contract: info.contract,
              playerId: event.returnValues.tokenId,
            })
          );
          dispatch(
            addEvent({
              time: Date.now(),
              txt: `User ${event.returnValues.from} transferred player number #${event.returnValues.tokenId} to user ${event.returnValues.to}! 🤝`,
            })
          );
          if (isNotification)
            toast.info(
              `User ${event.returnValues.from} transferred player number #${event.returnValues.tokenId} to user ${event.returnValues.to}! 🤝`,
              { autoClose: 3000 }
            );
        }
        break;
      case 'AttackIncreased':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._playerId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._playerId} increased attack! 💪`,
          })
        );
        if (isNotification)
          toast.info(
            `Player number #${event.returnValues._playerId} increased attack! 💪`,
            { autoClose: 3000 }
          );
        break;
      case 'ArmorIncreased':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._playerId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._playerId} increased armor! 🛡️`,
          })
        );
        if (isNotification)
          toast.info(
            `Player number #${event.returnValues._playerId} increased armor! 🛡️`
          );
        break;
      case 'DefenseIncreased':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._playerId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._playerId} increased defense! 🦾`,
          })
        );
        if (isNotification)
          toast.info(
            `Player number #${event.returnValues._playerId} increased defense! 🦾`,
            { autoClose: 3000 }
          );
        break;
      case 'StaminaIncreased':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._playerId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._playerId} increased stamina! 🏋️‍♂️`,
          })
        );
        if (isNotification)
          toast.info(
            `Player number #${event.returnValues._playerId} increased stamina! 🏋️‍♂️`,
            { autoClose: 3000 }
          );
        break;
      case 'Revived':
        await store.dispatch(
          updatePlayer({
            contract: info.contract,
            playerId: event.returnValues._playerId,
          })
        );
        dispatch(
          addEvent({
            time: Date.now(),
            txt: `Player number #${event.returnValues._playerId} revived back into the game! 😍 😇`,
          })
        );
        if (isNotification)
          toast.info(
            `Player number #${event.returnValues._playerId} revived back into the game! 😍 😇`,
            { autoClose: 3000 }
          );
        break;
      default:
        break;
    }
  };

  return (
    <div className="App">
      <Header
        setActiveModal={setActiveModal}
        balance={balance}
        setIsNotification={setIsNotification}
        isNotification={isNotification}
        isAudio={isAudio}
        setIsAudio={setIsAudio}
      />
      <Routes>
        <Route
          path="/"
          element={<Welcome isAudio={isAudio} setIsAudio={setIsAudio} />}
        />
        <Route path="/map" element={<Map isAudio={isAudio} />} />
        <Route
          path="/mint"
          element={
            <Mint
              confirmTransaction={confirmTransaction}
              mintInfo={mintInfo}
              isAudio={isAudio}
            />
          }
        />
        <Route
          path="/shop"
          element={
            <Shop confirmTransaction={confirmTransaction} isAudio={isAudio} />
          }
        />
        <Route
          path="/shop/:type"
          element={
            <Shop confirmTransaction={confirmTransaction} isAudio={isAudio} />
          }
        />
        <Route
          path="/graveyard"
          element={
            <Graveyard
              confirmTransaction={confirmTransaction}
              isAudio={isAudio}
            />
          }
        />
        <Route
          path="/arena"
          element={
            <Arena confirmTransaction={confirmTransaction} isAudio={isAudio} />
          }
        />
        <Route path="/overview" element={<Overview isAudio={isAudio} />} />
      </Routes>
      <Footer isAudio={isAudio} setIsAudio={setIsAudio} />
      <PlayerDetails />
      {activeModal === 'confirmationModal' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <ConfirmationModal
            params={params}
            closeFunc={() => setActiveModal('')}
            confirmFanc={sendTransaction}
          />
        </div>
      )}
      {activeModal === 'waitingforConfirmation' && (
        <WaitingToConnect
          closeFunction={() => setActiveModal('')}
          header={'Waiting for confirmation'}
          subHeader={`${params.desc.action}`}
          orangetxt={'Confirm this transaction in your wallet'}
          loadingUp={true}
        />
      )}
      {activeModal === 'errorModal' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <ErrorModal func={() => setActiveModal('')} error={error} />
        </div>
      )}
      {activeModal === 'submittedModal' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <SubmittedModal func={() => setActiveModal('')} txHash={txHash} />
        </div>
      )}
      {activeModal === 'connectModal' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <ConnectModal
            setActiveModal={setActiveModal}
            setChosenConnection={setChosenConnection}
          />
        </div>
      )}
      {activeModal === 'waitingToConnect' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <WaitingToConnect
            closeFunction={() => setActiveModal('')}
            header={'Waiting to connect'}
            subHeader={'Confirm this connection in your wallet'}
            footer={
              'By connecting a wallet, you agree to RVT Terms of Service and acknowledge that you have read and understand the RVT Protocol Disclaimer.'
            }
          />
        </div>
      )}
      {activeModal === 'failToConnect' && (
        <div className="outside-click" onClick={() => setActiveModal('')}>
          <FailToConnect
            setActiveModal={setActiveModal}
            chosenConnection={chosenConnection}
          />
        </div>
      )}
      <div className="toast-container">
        <ToastContainer
          autoClose={3000}
          theme={isDarkMode ? 'dark' : 'light'}
          limit={8}
          newestOnTop={true}
        />
      </div>
    </div>
  );
}

export default App;
