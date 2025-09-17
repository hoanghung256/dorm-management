import { UserButton } from "@clerk/clerk-react";
import { HiArrowNarrowUp } from "react-icons/hi";
import { Outlet } from "react-router-dom";

const DefaultLayout = () => {
    return (
        <div className="">
            <div className="d-flex justify-content-end align-items-center p-3 border-bottom">
                <UserButton />
            </div>
            <div className="main-content w-100 bg-white" style={{ height: "100vh" }}>
                {/* <NavbarLayout /> */}
                <div className="d-inline position-relative w-100">
                    <div className="">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefaultLayout;
