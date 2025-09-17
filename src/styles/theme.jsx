import { createTheme } from "@mui/material/styles";
import { purple, deepPurple, grey } from "@mui/material/colors";

const theme = createTheme({
    cssVariables: true,
    palette: {
        mode: "light",
        primary: {
            light: purple[300],
            main: purple[500],
            dark: purple[700],
            contrastText: "#ffffff",
        },
        secondary: {
            light: deepPurple[300],
            main: deepPurple[500],
            dark: deepPurple[700],
            contrastText: "#ffffff",
        },
        background: {
            default: "#fafafa",
            paper: "#ffffff",
        },
        divider: grey[300],
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600, fontSize: "3rem" },
        h2: { fontWeight: 600, fontSize: "2.25rem" },
        button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { borderRadius: 8 },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundImage: `linear-gradient(90deg, ${purple[600]}, ${deepPurple[500]})`,
                },
            },
        },
    },
});

export default theme;
