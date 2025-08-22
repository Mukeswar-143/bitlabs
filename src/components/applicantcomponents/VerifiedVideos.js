import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../services/ApplicantAPIService";
import { useUserContext } from "../common/UserProvider";

const VerifiedVideos = () => {
  const { user } = useUserContext();
  const userId = user.id;

  const [videoList, setVideoList] = useState([]);
  const [watchedVideos, setWatchedVideos] = useState({});
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef(null);
  const videoRefs = useRef([]);

  const videosPerPage = 3;
  const totalDots = Math.ceil(videoList.length / videosPerPage);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const jwtToken = localStorage.getItem("jwtToken");
        const res = await axios.get(`${apiUrl}/videos/recommended/${userId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (res.data.length > 0) {
          setVideoList(res.data);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };
    fetchVideos();
  }, [userId]);

  // Mark video as watched when ended
  const handleEnded = async (videoId) => {
    if (watchedVideos[videoId]) return;
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      await axios.post(
        `${apiUrl}/api/video-watch/track`,
        { applicantId: userId, videoId },
        { headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" } }
      );
      setWatchedVideos((prev) => ({ ...prev, [videoId]: true }));
    } catch (err) {
      console.error("Failed to log watch:", err);
    }
  };

  // Scroll carousel
  const scrollToDot = (dotIndex) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollX = dotIndex * container.offsetWidth;
    container.scrollTo({ left: scrollX, behavior: "smooth" });
    setActiveDot(dotIndex);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    const newIndex = Math.round(container.scrollLeft / container.offsetWidth);
    setActiveDot(newIndex);
  };

  // Pause all other videos when one plays
  const handlePlay = (index) => {
    videoRefs.current.forEach((video, i) => {
      if (i !== index && video && !video.paused) video.pause();
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Check Our <span style={{ color: "orange" }}>Videos</span>
      </h2>

      <div style={styles.carouselWrapper}>
        {/* Left Button */}
        <button
          onClick={() => scrollToDot(activeDot - 1)}
          style={styles.sideButton}
          disabled={activeDot === 0}
        >
          ◀
        </button>

        {/* Video Scrollable Area */}
        <div style={styles.scrollWrapper}>
          <div
            style={styles.scrollContainer}
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {videoList.map((video, index) => (
              <div key={video.videoId || index} style={styles.card}>
                <div style={styles.playerWrapper}>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.s3url}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    onPlay={() => handlePlay(index)}
                    onEnded={() => handleEnded(video.videoId)}
                    style={styles.video}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p style={styles.caption}>{video.title || `Video ${index + 1}`}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Button */}
        <button
          onClick={() => scrollToDot(activeDot + 1)}
          style={styles.sideButton}
          disabled={activeDot === totalDots - 1}
        >
          ▶
        </button>
      </div>

      {/* Navigation Dots */}
      <div style={styles.dotsContainer}>
        {Array.from({ length: totalDots }).map((_, index) => (
          <span
            key={index}
            style={{
              ...styles.dot,
              backgroundColor: activeDot === index ? "#ff9800" : "#ccc",
            }}
            onClick={() => scrollToDot(index)}
          />
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "sans-serif",
    position: "relative",
  },
  heading: {
    textAlign: "center",
    fontSize: "26px",
    marginBottom: "30px",
    fontWeight: "bold",
  },
  carouselWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "nowrap",
  },
  scrollWrapper: {
    overflow: "hidden",
    flex: 1,
  },
  scrollContainer: {
    display: "flex",
    overflowX: "auto",
    scrollBehavior: "smooth",
    gap: "20px",
    padding: "10px 0",
    scrollbarWidth: "none",
  },
  card: {
    minWidth: "250px",
    flex: "0 0 auto",
    textAlign: "center",
    maxWidth: "90vw",
  },
  playerWrapper: {
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },
  video: {
    width: "100%",
    height: "auto",
    maxHeight: "200px",
    borderRadius: "10px",
  },
  caption: {
    marginTop: "10px",
    fontWeight: "bold",
    color: "#333",
  },
  sideButton: {
    backgroundColor: "#ff9800",
    border: "none",
    color: "white",
    fontSize: "20px",
    padding: "10px 12px",
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
  },
  dotsContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    gap: "10px",
    flexWrap: "wrap",
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  // Media Queries
  "@media (max-width: 1024px)": {
    card: {
      minWidth: "200px",
      maxWidth: "80vw",
    },
    video: {
      maxHeight: "180px",
    },
  },
  "@media (max-width: 768px)": {
    card: {
      minWidth: "180px",
      maxWidth: "70vw",
    },
    video: {
      maxHeight: "160px",
    },
    sideButton: {
      padding: "8px 10px",
      fontSize: "18px",
    },
  },
  "@media (max-width: 480px)": {
    card: {
      minWidth: "150px",
      maxWidth: "90vw",
    },
    video: {
      maxHeight: "140px",
    },
    sideButton: {
      padding: "6px 8px",
      fontSize: "16px",
    },
  },
};

export default VerifiedVideos;
