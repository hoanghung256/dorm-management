export const log = (...args) => {
    if (location.host.includes("localhost")) {
        console.log(...args);
    }
};
