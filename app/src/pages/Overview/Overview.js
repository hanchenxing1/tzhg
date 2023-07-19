import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllInfo } from "../../features/infoSlice";
import { selectAllPlayers } from "../../features/playersSlice";
import { useWeb3React } from "@web3-react/core";
import {
  fetchPastEvents,
  selectAllPastEvents,
} from "../../features/pastEventsSlice";
import { playerUpdate } from "../../features/playerToShowSlice";
import { store } from "../../features/store";

import "./overview.css";
import headerImg from "../../assets/pic/overview-header.png";
import headerImgSmall from "../../assets/pic/overview-header-small.png";
import dataImg from "../../assets/pic/overview-data.png";
import PlayersList from "../../components/PlayersList/PlayersList";
import filterRabbits from "../../assets/pic/filter-rabbits.png";
import filterTurtles from "../../assets/pic/filter-turtles.png";
import filterMyPlayers from "../../assets/pic/filter-my-players.png";
import filterDead from "../../assets/pic/filter-dead-players.png";
import filterAllPlayers from "../../assets/pic/filter-all-players.png";

const Overview = ({ isAudio }) => {
  const [gameInfo, setGameInfo] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [moreInfo, setMoreInfo] = useState([0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState({
    headerImg: true,
    backgroundImg: true,
    sliceImg: true,
  });
  const info = useSelector(selectAllInfo);
  const [filter, setFilter] = useState("");
  const playersData = useSelector(selectAllPlayers);
  const { accounts, chainId } = useWeb3React();
  const [playersToShow, setPlayersToShow] = useState([]);
  const pastEvents = useSelector(selectAllPastEvents);
  const dispatch = useDispatch();
  const audio = new Audio(require("../../assets/music/Slayer-Overview.mp3"));
  audio.loop = true;

  useEffect(() => {
    getGameInfo();
  }, []);

  useEffect(() => {
    getGameInfo();
    // console.log(chainId, info);
    if(chainId)store.dispatch(fetchPastEvents(info));
  }, [info]);

  useEffect(() => {
    getUpgrades();
  }, [pastEvents]);

  useEffect(() => {
    filterPlayers();
    getGameInfo();
  }, [playersData]);

  useEffect(() => {
    filterPlayers();
  }, [filter]);

  useEffect(() => {
    if (isAudio) audio.play();
    else {
      audio.pause();
      audio.currentTime = 0;
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isAudio]);

  const getUpgrades = () => {
    // let upgrades = [8, 2, 13, 17];
    let upgrades = [0, 0, 0, 0];
    for (let i = 0; i < pastEvents.length; i++) {
      if (pastEvents[i].event.slice(-5) === "eased") {
        if (pastEvents[i].returnValues._playerId % 2 === 0) {
          upgrades[0]++;
        } else {
          upgrades[1]++;
        }
      }
      if (pastEvents[i].event === "Attacked") {
        if (pastEvents[i].returnValues._eaterId % 2 === 0) {
          upgrades[2]++;
        } else {
          upgrades[3]++;
        }
      }
    }
    setMoreInfo(upgrades);
  };

  const setNewFilter = (newFilter) => {
    if (newFilter === filter || !newFilter) {
      setFilter("");
      return;
    }
    if (newFilter === "Turtle") setFilter("Turtle");
    if (newFilter === "Rabbit") setFilter("Rabbit");
    if (newFilter === "Dead") setFilter("Dead");
    if (newFilter === "Mine") setFilter("Mine");
  };

  const filterPlayers = () => {
    let newPlayersToShow;
    if (filter === "Mine") {
      if (accounts)
        newPlayersToShow = playersData.filter(
          (player) => player.owner === accounts[0]
        );
      else newPlayersToShow = [];
    } else if (filter === "Dead")
      newPlayersToShow = playersData.filter((player) => !player.player[4]);
    else {
      newPlayersToShow = playersData.filter(
        (player) => player.player[1] === filter
      );
    }

    if (filter === "") newPlayersToShow = playersData;
    setPlayersToShow(newPlayersToShow);
  };

  const getGameInfo = async () => {
    const params = {
      to: info.contractJSON.address,
      data: info.contract.methods.getGameInfo().encodeABI(),
    };
    try {
      const result = await info.web3.eth.call(params);
      let newArray = [0, 0, 0, 0, 0, 0, 0, 0];
      let resultCleaned = result.replace(/^0x+/, "");
      let resultArray = resultCleaned.match(/.{1,64}/g);
      for (let i = 0; i < resultArray.length; i++) {
        newArray[i] = parseInt(resultArray[i], 16);
      }
      setGameInfo(newArray);
    } catch (err) {
      setGameInfo([0, 0, 0, 0, 0, 0, 0, 0]);
      console.log(err);
    }
  };

  const onShowPlayer = (player) => {
    dispatch(playerUpdate(player));
  };
  // console.log(pastEvents);
  if (isLoading.headerImg || isLoading.backgroundImg || isLoading.sliceImg)
    return (
      <div className="overview-background-small">
        {" "}
        <img
          alt=""
          src={headerImg}
          style={{ display: 'none' }}
          onLoad={() => setIsLoading((prev=>{return{...prev,headerImg: false}}))}
        />
        <img
          alt=""
          src={require('../../assets/pic/overview-background.png')}
          style={{ display: 'none' }}
          onLoad={() => setIsLoading((prev=>{return{...prev,backgroundImg: false}}))}
        />
        <img
          alt=""
          src={dataImg}
          style={{ display: 'none' }}
          onLoad={() => setIsLoading((prev=>{return{...prev,sliceImg: false}}))}
        />
        <div className="loader-container" style={{ height: "35%" }}>
          <div className="loader"></div>
        </div>
      </div>
    );
  return (
    <div className="overview">
      <div className="overview-header">
        <img alt="" id="overview-header-img" src={headerImg} onLoad={() => setIsLoading(false)} />
        <img alt="" id="overview-header-img-small" src={headerImgSmall} onLoad={() => setIsLoading(false)} />
        <div className="overview-rabbit-header">TEAM RABBIT</div>
        <div className="overview-turtle-header">TEAM TURTLE</div>
        <div className="overview-score">
          <span className="overview-score-rabbit">{gameInfo[1]}</span> -{" "}
          <span className="overview-score-turtle">{gameInfo[0]}</span>
        </div>
      </div>
      <div className="overview-all-data">
        <div className="overview-data">
          <img alt="" src={dataImg} />
          <div className="data-rabbit">{moreInfo[2]}</div>
          <div className="data-turtle">{moreInfo[3]}</div>
          <div className="data-sector">Attacks</div>
        </div>
        <div className="overview-data">
          <img alt="" src={dataImg} />
          <div className="data-rabbit">{moreInfo[0]}</div>
          <div className="data-turtle">{moreInfo[1]}</div>
          <div className="data-sector">Upgrades</div>
        </div>
        <div className="overview-data">
          <img alt="" src={dataImg} />
          <div className="data-rabbit">{gameInfo[7]}</div>
          <div className="data-turtle">{gameInfo[6]}</div>
          <div className="data-sector">Revived</div>
        </div>
        <div className="overview-data">
          <img alt="" src={dataImg} />
          <div className="data-rabbit">{gameInfo[5]}</div>
          <div className="data-turtle">{gameInfo[4]}</div>
          <div className="data-sector">Dead</div>
        </div>
        <div className="overview-data">
          <img alt="" src={dataImg} />
          <div className="data-rabbit">{gameInfo[3]}</div>
          <div className="data-turtle">{gameInfo[2]}</div>
          <div className="data-sector">Alive</div>
        </div>
      </div>
      <div className="overview-all-players">
        {playersData.length ? (
          <PlayersList
            playersToShow={playersToShow}
            onClickFunc={onShowPlayer}
            filter={filter}
          />
        ) : (
          <div className="player-list">
            <div className="loader-container" style={{ height: "40%" }}>
              <div className="loader"></div>
            </div>
          </div>
        )}
        <div className="players-filter">
          <div>
            <img
              className={filter === "Turtle" ? "active" : ""}
              alt=""
              src={filterTurtles}
              onClick={() => setNewFilter("Turtle")}
            />
          </div>
          <div>
            <img
              className={filter === "Rabbit" ? "active" : ""}
              alt=""
              src={filterRabbits}
              onClick={() => setNewFilter("Rabbit")}
            />
          </div>
          <div>
            <img
              className={filter === "Mine" ? "active" : ""}
              alt=""
              src={filterMyPlayers}
              onClick={() => setNewFilter("Mine")}
            />
          </div>
          <div>
            <img
              className={filter === "" ? "active" : ""}
              alt=""
              src={filterAllPlayers}
              onClick={() => setNewFilter("")}
            />
          </div>
          <div>
            <img
              className={filter === "Dead" ? "active" : ""}
              alt=""
              src={filterDead}
              onClick={() => setNewFilter("Dead")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
