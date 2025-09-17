import axios from "axios";
import { log } from "../utils/log";
import { HTTP_RESPONSE_STATUS_CODE } from "../constants/api";

export const axiosInstance = axios.create({});

export const apiConnector = (method, url, bodyData, headers, params) => {
    const res = axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData ? bodyData : null,
        headers: headers ? headers : null,
        params: params ? params : null,
    });

    res.then((data) => {
        log(data);
    }).catch((error) => {
        const status = error?.response?.status ?? error?.status;
        if (status == HTTP_RESPONSE_STATUS_CODE.UNAUTHORIZED) {
            log("Unauthorized");
            // dispatch(setToken(null));
            // dispatch(setUser(null));
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        log(error);
    });

    return res;
};
