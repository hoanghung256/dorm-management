import { SignIn } from "@clerk/clerk-react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../../../../assets/logo.png";
import background from "../../../../assets/background.png";
import { Link } from "react-router-dom";


function CustomSignIn() {
  return (
    <div className="container-fluid min-vh-100 d-flex p-0 bg-white">

      <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 px-3 px-md-5">
        <div className="w-100" style={{ maxWidth: 420, minHeight: 420 }}>
          <div className="mb-3" style={{ minHeight: 320 }}>
           <SignIn
              signUpUrl="/signup"
              forceRedirectUrl="/login-callback"
              fallbackRedirectUrl="/login-callback"
              appearance={{
                elements: {
                  
                 internal: {
                  display: "none",
                 },
                  formButtonPrimary: {
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "none",
                    marginTop: "16px",
                    "&:hover": {
                      background: "linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)",
                    },
                  },
                },
              }}
              
            />
          </div>
        </div>
      </div>
      <div
        className="d-none d-md-flex flex-column align-items-center justify-content-center flex-grow-1 text-white"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="p-4 rounded"
          style={{
            backgroundColor: "rgba(111, 66, 193, 0.9)",
            maxWidth: "380px",
          }}
        >
          <h3 className="fw-bold mb-3">Giải pháp Quản lí phòng trọ</h3>
          <p className="mb-0">
            Giải pháp quản lý phòng trọ toàn diện giúp đơn giản hóa việc phân
            phòng, theo dõi cư dân, xử lý sự cố và gửi thông báo thời gian thực.
          </p>
        </div>
      </div>
    </div>
  );
}
export default CustomSignIn;
