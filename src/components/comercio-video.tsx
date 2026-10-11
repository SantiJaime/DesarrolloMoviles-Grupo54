import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

interface VideoProps {
  videoUrl: string;
}

export function ComercioVideo({ videoUrl }: VideoProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        startsPictureInPictureAutomatically={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 220,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
