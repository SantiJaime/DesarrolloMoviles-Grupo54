import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StateView } from "@/src/components/state-view";

interface VideoProps {
  videoUrl: string;
}

export function ComercioVideo({ videoUrl }: VideoProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.muted = false;
  });
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  if (status === "error")
    return (
      <StateView
        type="error"
        title="Video no disponible"
        message="Revisá la conexión o guardá el video en el teléfono para verlo sin datos."
        actionLabel="Reintentar"
        onAction={() => {
          player.replaceAsync(videoUrl).catch(() => {});
        }}
      />
    );

  return (
    <View style={styles.container}>
      {status === "loading" && (
        <ActivityIndicator accessibilityLabel="Cargando video" />
      )}
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
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
