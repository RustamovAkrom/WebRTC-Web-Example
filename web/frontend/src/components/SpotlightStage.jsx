import VideoTile from "./VideoTile.jsx";

// SpotlightStage — asosiy (katta) tile. Spotlight nishonidagi ishtirokchi shu yerda.
export default function SpotlightStage({ participant }) {
  if (!participant) {
    return (
      <div className="stage">
        <div className="tile placeholder">
          <p>Ishtirokchilar kutilmoqda…</p>
        </div>
      </div>
    );
  }
  return (
    <div className="stage">
      <VideoTile
        stream={participant.stream}
        name={participant.name}
        muted={participant.self}
        micOn={participant.micOn}
        camOn={participant.camOn}
        speaking={participant.speaking}
        hand={participant.hand}
      />
    </div>
  );
}
