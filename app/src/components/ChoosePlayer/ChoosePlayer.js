import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";

import "./choose-player.css";
import arrowRight from "../../assets/pic/arrow-right-btn.png";
import arrowLeft from "../../assets/pic/arrow-left-btn.png";
import btn from "../../assets/pic/mint-btn.png";
import filterRabbits from "../../assets/pic/filter-rabbits.png";
import filterTurtles from "../../assets/pic/filter-turtles.png";
import filterMyPlayers from "../../assets/pic/filter-my-players.png";
import filterAllPlayers from "../../assets/pic/filter-all-players.png";
import PlayersList from "../PlayersList/PlayersList";

const ChoosePlayer = ({ playersData, setChoosen }) => {
  const { accounts } = useWeb3React();
  const [choosenPlayer, setChoosenPlayer] = useState(0);
  const [playersToShow, setPlayersToShow] = useState(playersData);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    filterPlayers();
  }, [filter, playersData]);

  const setNewFilter = (newFilter) => {
    if (newFilter === filter || !newFilter) {
      setFilter("");
      return;
    }
    if (newFilter === "Turtle") setFilter("Turtle");
    if (newFilter === "Rabbit") setFilter("Rabbit");
    if (newFilter === "Mine"  && accounts && accounts[0]) setFilter("Mine");
  };

  const filterPlayers = () => {
    let newPlayersToShow;
    if (filter === "Mine") {
      if (accounts)
        newPlayersToShow = playersData.filter(
          (player) => player.owner === accounts[0]
        );
        else newPlayersToShow = []
    } else {
      newPlayersToShow = playersData.filter(
        (player) => player.player[1] === filter
      );
    }
    if (filter === "") newPlayersToShow = playersData;
    if (newPlayersToShow.length === 0) return;
    setChoosenPlayer(0);
    setPlayersToShow(newPlayersToShow);
  };

  const arrowChoosingPlayer = (num) => {
    let index = choosenPlayer + num;
    if (index < 0) index = playersToShow.length - 1;
    if (index === playersToShow.length) index = 0;
    setChoosenPlayer(index);
  };

  const getNameStyle = (player) => {
    if (player.player[1] === "Turtle")
      return {
        background:
          "linear-gradient(96.47deg, #BF4040 0.9%, #CC6677 52.96%, #BF406A 98.8%)",
      };
    else
      return {
        background:
          "linear-gradient(277.43deg,#0055ff 3.63%,#3355ff 38.08%,#1500ff 96.03%)",
      };
  };
  if (!playersToShow.length)
    return (
      <div className="loader-container" style={{height: '24%'}}>
          <div className="loader"></div>
        </div>
    );
  return (
    <div className="choose-player">
      <div className="choosen-player">
        <img alt="" src={playersToShow[choosenPlayer].image} />
        <div className="arrow-right">
          <img
            alt=""
            src={arrowRight}
            onClick={() => arrowChoosingPlayer(+1)}
          />
        </div>
        <div className="arrow-left">
          <img alt="" src={arrowLeft} onClick={() => arrowChoosingPlayer(-1)} />
        </div>
        <div className="select" onClick={()=>setChoosen(playersToShow[choosenPlayer])}>
          <img alt="" src={btn} />
          <div>Select</div>
        </div>
        <div
          className="player-name"
          style={getNameStyle(playersToShow[choosenPlayer])}
        >
          {`#${playersToShow[choosenPlayer].player[0].split("#")[1]}`}
        </div>
      </div>
      <div className="all-players">
        <PlayersList playersToShow={playersToShow} filter={filter} onClickFunc={(playerToShow)=>setChoosenPlayer(playersToShow.findIndex(player=>player.id === playerToShow.id))}/>
        <div className="players-filter">
          <div className={filter === "Turtle" ? "active" : ""}><img
            alt=""
            src={filterTurtles}
            onClick={() => setNewFilter("Turtle")}
          /></div>
          <div className={filter === "Rabbit" ? "active" : ""}><img
            alt=""
            src={filterRabbits}
            onClick={() => setNewFilter("Rabbit")}
          /></div>
          <div className={filter === "Mine" ? "active" : ""}><img            
            alt=""
            src={filterMyPlayers}
            onClick={() => setNewFilter("Mine")}
          /></div>
          <div className={filter === "" ? "active" : ""}><img            
            alt=""
            src={filterAllPlayers}
            onClick={() => setNewFilter("")}
          /></div>
        </div>
      </div>
    </div>
  );
};

export default ChoosePlayer;
