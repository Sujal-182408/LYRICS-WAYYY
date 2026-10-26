import { useEffect, useState } from "react";
import { getSongs } from "../services/songService";

function Home() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await getSongs();
        setSongs(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div>
      <h1>All Songs</h1>

      {songs.map((song) => (
        <div key={song._id}>
          <img
            src={`http://192.168.1.7:5001//${song.coverImage}`}
            alt={song.title}
            width={150}
          />

          <h3>{song.title}</h3>
          <p>{song.artist}</p>

          <audio controls>
            <source
              src={`http://192.168.1.7:5001//${song.audioFile}`}
              type="audio/mpeg"
            />
          </audio>
        </div>
      ))}
    </div>
  );
}

export default Home;