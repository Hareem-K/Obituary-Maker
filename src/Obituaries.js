import React, { useState, useEffect, useRef } from "react";

function Obituaries({ obituaries }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "long", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const [activeObituaryIndices, setActiveObituaryIndices] = useState([]);

  useEffect(() => {
    // Set the most recent obituary as active by default
    const mostRecentObituary = obituaries.length > 0 ? obituaries[0] : null;
    if (mostRecentObituary) {
      setActiveObituaryIndices([obituaries.indexOf(mostRecentObituary)]);
    }
  }, [obituaries]);

  const handleObituaryClick = (index) => {
    if (activeObituaryIndices.includes(index)) {
      // If the clicked obituary is active, remove it from the active obituaries
      setActiveObituaryIndices(activeObituaryIndices.filter((i) => i !== index));
    } else {
      // If the clicked obituary is not active, set it as active
      setActiveObituaryIndices([...activeObituaryIndices, index]);
    }
  };

  // handles play/pause button and makes the play button appear after audio is finished playing
  const toggleAudioPlayback = (audioElement, buttonElement) => {
    if (audioElement.paused) {
      audioElement.play();
      buttonElement.src = "https://cdn-icons-png.flaticon.com/512/16/16427.png";
    } else {
      audioElement.pause();
      buttonElement.src = "https://cdn-icons-png.flaticon.com/512/0/375.png";
    }
  };

  const AudioPlayer = ({ audioSrc, index }) => {
    const audioRef = React.useRef();
    const buttonRef = React.useRef();

    useEffect(() => {
      const audioElement = audioRef.current;
      const buttonElement = buttonRef.current;

      const resetButtonImage = () => {
        buttonElement.src = "https://cdn-icons-png.flaticon.com/512/0/375.png";
      };

      audioElement.addEventListener('ended', resetButtonImage);

      return () => {
        audioElement.removeEventListener('ended', resetButtonImage);
      };
    }, []);

    return (
      <>
        <audio id={`audio-${index}`} src={audioSrc} style={{ display: "none" }} ref={audioRef}></audio>
        <img
          className="play-pause-btn"
          id={`play-pause-btn-${index}`}
          src="https://cdn-icons-png.flaticon.com/512/0/375.png"
          alt="Play/Pause"
          onClick={(e) => {
            e.stopPropagation();
            toggleAudioPlayback(audioRef.current, buttonRef.current);
          }}
          ref={buttonRef}
        />
      </>
    );
  };

  return (
    <div className="obituariesContainer">
      {obituaries.map((obituary, index) => (
        <div
          className="obituaryBox"
          key={index}
          onClick={() => handleObituaryClick(index)}
          style={{
            height: activeObituaryIndices.includes(index) ? "auto" : "300px",
            marginTop: !activeObituaryIndices.includes(index) ? "0px" : "0", //can be adjusted later
          }}
        >
          <img className="deceasedImage" src={obituary.image_res} alt="Obituary Image" />
          <p className="deceasedName">{obituary.name}</p>
          <p className="lifeLength">
            {formatDate(obituary.birth)} - {formatDate(obituary.death)}
          </p>
          {activeObituaryIndices.includes(index) && (
            <div className="text-and-audio-box">
              <p className="description">{obituary.description}</p>
              <AudioPlayer audioSrc={obituary.polly_url} index={index} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Obituaries;
