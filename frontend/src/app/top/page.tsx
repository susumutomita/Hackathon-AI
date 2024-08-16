"use client";
import Link from "next/link";
import { Button, Container, Typography, Box } from "@mui/material";

export default function Home() {
  return (
    <Container
      maxWidth="md"
      className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
      style={{ padding: "20px" }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom>
          Onchain Senryu
        </Typography>
        <Typography variant="h5" component="p" gutterBottom>
          Discover and create Japanese senryu poetry with modern technology.
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        gap={3}
        flexDirection="row"
        mt={4}
      >
        <Link href="/create-senryu" passHref>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#0070f3",
              color: "#fff",
              padding: "10px 20px",
              textTransform: "none",
              ":hover": { backgroundColor: "#005bb5" },
            }}
          >
            Create a Senryu
          </Button>
        </Link>
        <Link href="/explore-senryus" passHref>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#34a853",
              color: "#fff",
              padding: "10px 20px",
              textTransform: "none",
              ":hover": { backgroundColor: "#2b8c44" },
            }}
          >
            Explore Senryus
          </Button>
        </Link>
        <Link href="/view-result" passHref>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#ea4335",
              color: "#fff",
              padding: "10px 20px",
              textTransform: "none",
              ":hover": { backgroundColor: "#c53829" },
            }}
          >
            View Results
          </Button>
        </Link>
      </Box>
    </Container>
  );
}
