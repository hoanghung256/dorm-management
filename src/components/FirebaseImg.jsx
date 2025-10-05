import { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { getFileDownloadURL } from "../services/storage";

/**
 * FirebaseImg
 * Props:
 *  - fileName: path stored in Firebase
 *  - enableHoverZoom: bật tắt hiệu ứng zoom (default true)
 */
const FirebaseImg = ({
    fileName,
    alt = "",
    inputClassName,
    style,
    width = "auto",
    height = "auto",
    enableHoverZoom = true,
}) => {
    const [imgSrc, setImgSrc] = useState(null);

    useEffect(() => {
        if (fileName) {
            getImage();
        }
    }, [fileName]);

    const getImage = async () => {
        try {
            const url = await getFileDownloadURL(fileName);
            setImgSrc(url);
        } catch (error) {
            // setClassName((prev) => prev + " d-none");
            console.error("Error fetching image:", error);
            setImgSrc(fileName);
        }
    };

    return (
        <LazyLoadImage
            className={`${inputClassName ?? ""}`}
            src={imgSrc}
            alt={alt}
            width={width}
            height={height}
            style={{
                objectFit: "cover",
                ...style,
            }}
            effect="blur"
        />
    );
};

export default FirebaseImg;
