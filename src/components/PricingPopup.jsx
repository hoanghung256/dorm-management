import React, { useState } from "react";
import "../styles/PricingPopup.css";
const PricingPopup = ({ isOpen, onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState("basic");

    const plans = [
        {
            id: "basic",
            name: "Cơ bản",
            price: "49,000",
            duration: "/tháng",
            tag: "PHỔ BIẾN NHẤT",
            tagColor: "#9333ea",
            suitable: "Quản lý 5-15 phòng",
            features: [
                "Có thể quản lý tối đa 1 tòa nhà",
                "Có thể quản lý tối đa 15 phòng",
                "Tự động nhắc nhở hạn tiền thuê nhà",
                "Quản lý thông tin người thuê nhà",
                "Báo cáo hóa đơn cơ bản (PDF/Excel)",
            ],
            buttonText: "GÓI DÙNG CƠ BẢN",
            buttonColor: "#9333ea",
        },
        {
            id: "professional",
            name: "Chuyên nghiệp",
            price: "79,000",
            duration: "/tháng",
            suitable: "Chủ nhà có nhiều hơn 15 phòng",
            features: [
                "Tiếp tục tính năng của gói cơ bản",
                "Có thể quản lý nhiều tòa nhà",
                "Quản lí nhiều phòng hơn với chi phí thấp (5,000 VND/phòng)",
                "Hợp đồng điện tử",
                "Báo cáo sự cố thông qua chat",
                "AI phân tích hình ảnh tình trạng của thiết bị phòng",
            ],
            buttonText: "GÓI DÙNG NÂNG CAO",
            buttonColor: "#9333ea",
        },
    ];

    if (!isOpen) return null;

    return (
        <div className="pricing-popup-overlay" onClick={onClose}>
            <div className="pricing-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="pricing-popup-header">
                    <h2>Lựa chọn gói</h2>
                    <p>Chọn gói quản lý phù hợp với nhu cầu của bạn. Nâng cấp hoặc hạ gói mọi lúc.</p>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="pricing-plans">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`pricing-plan ${selectedPlan === plan.id ? "selected" : ""}`}
                            onClick={() => setSelectedPlan(plan.id)}
                        >
                            {plan.tag && (
                                <div className="plan-tag" style={{ backgroundColor: plan.tagColor }}>
                                    {plan.tag}
                                </div>
                            )}

                            <div className="plan-header">
                                <h3>{plan.name}</h3>
                                <div className="plan-price">
                                    <span className="price-amount">{plan.price} VNĐ </span>
                                    <span className="price-duration">{plan.duration}</span>
                                </div>
                            </div>

                            <div className="plan-suitable">
                                <strong>PHÙ HỢP VỚI</strong>
                                <p>{plan.suitable}</p>
                            </div>

                            <div className="plan-features">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="feature-item">
                                        <span className="check-icon">✓</span>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="plan-button" style={{ backgroundColor: plan.buttonColor }}>
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="popup-footer">
                    <button className="back-button" onClick={onClose}>
                        ← Trở về
                    </button>
                    {/* <button className="complete-button">Hoàn thành</button> */}
                </div>
            </div>
        </div>
    );
};

export default PricingPopup;
