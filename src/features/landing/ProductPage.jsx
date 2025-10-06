import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Globe, DollarSign, Headphones, ArrowRight } from "lucide-react";

const ProductPage = () => {
    const [formData, setFormData] = useState({
        company: "",
        name: "",
        email: "",
        phone: "",
        description: "",
        agreement: false,
    });

    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredBenefit, setHoveredBenefit] = useState(null);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const services = [
        {
            title: "Full stack",
            description: "Công cụ quản lý toàn diện, hỗ trợ xử lý sự cố, tối ưu dịch vụ với giải pháp chuẩn hóa.",
            color: "#FF8C00",
        },
        {
            title: "Self service",
            description: "Cho phép người dùng tự tạo yêu cầu dịch vụ, tra cứu & xử lý vấn đề đơn giản.",
            color: "#4A90E2",
        },
        {
            title: "Cấu hình tự động",
            description: "Giúp nhà cung cấp dịch vụ quản lý nhanh chóng với cấu hình tiêu chuẩn và tự động hóa.",
            color: "#5A6ACF",
        },
    ];

    const benefits = [
        {
            icon: Globe,
            title: "Sản phẩm Việt cho người Việt",
            description: "Giao diện thân thiện, ngôn ngữ Tiếng Việt và tính năng phù hợp doanh nghiệp Việt Nam.",
            color: "#3b82f6",
        },
        {
            icon: DollarSign,
            title: "Tiết kiệm chi phí",
            description: "Tối ưu đến 50% chi phí license hợp lý cùng tính năng mạnh mẽ.",
            color: "#f59e0b",
        },
        {
            icon: Headphones,
            title: "Hỗ trợ 24/7",
            description: "Đội ngũ chuyên gia hỗ trợ nhanh chóng, mọi lúc mọi nơi.",
            color: "#10b981",
        },
    ];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % services.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                color: "#fff",
                fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
                overflowX: "hidden",
                position: "relative",
            }}
        >
            {/* Animated Background Elements */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                    opacity: 0.1,
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "25%",
                        right: "25%",
                        width: "384px",
                        height: "384px",
                        background: "#3b82f6",
                        borderRadius: "50%",
                        filter: "blur(80px)",
                        animation: "pulse 3s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "25%",
                        left: "25%",
                        width: "320px",
                        height: "320px",
                        background: "#f97316",
                        borderRadius: "50%",
                        filter: "blur(80px)",
                        animation: "pulse 3s ease-in-out infinite",
                        animationDelay: "1s",
                    }}
                />
            </div>

            {/* Hero Section */}
            <div style={{ position: "relative", zIndex: 1, padding: "48px 16px", textAlign: "center" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                    <h1
                        style={{
                            fontSize: "clamp(2rem, 5vw, 5rem)",
                            fontWeight: 900,
                            marginBottom: "24px",
                            background: "linear-gradient(90deg, #60a5fa 0%, #f97316 50%, #ec4899 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundSize: "200% auto",
                            animation: "gradient 3s ease infinite",
                            lineHeight: 1.2,
                        }}
                    >
                        Tính năng chính
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(1rem, 2vw, 1.5rem)",
                            opacity: 0.9,
                            marginBottom: "32px",
                            maxWidth: "768px",
                            margin: "0 auto 32px",
                            fontWeight: 300,
                        }}
                    >
                        Giải pháp công nghệ tối ưu cho doanh nghiệp của bạn
                    </p>

                    {/* Service Cards - Desktop */}
                    <div
                        style={{
                            display: "none",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "24px",
                            marginTop: "48px",
                            padding: "0 32px",
                        }}
                        className="desktop-grid"
                    >
                        {services.map((service, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "24px",
                                    padding: "24px",
                                    height: "256px",
                                    transition: "all 0.3s ease",
                                    background:
                                        index === currentSlide
                                            ? `linear-gradient(135deg, ${service.color}, ${service.color}cc)`
                                            : "rgba(255,255,255,0.05)",
                                    border:
                                        index === currentSlide
                                            ? `2px solid ${service.color}`
                                            : "1px solid rgba(255,255,255,0.1)",
                                    backdropFilter: "blur(10px)",
                                    boxShadow:
                                        index === currentSlide
                                            ? `0 20px 60px ${service.color}40`
                                            : "0 10px 30px rgba(0,0,0,0.3)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.05) translateY(-10px)";
                                    e.currentTarget.style.border = `2px solid ${service.color}`;
                                    e.currentTarget.style.boxShadow = `0 20px 60px ${service.color}40`;
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== currentSlide) {
                                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
                                    } else {
                                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                                    }
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                                        fontWeight: "bold",
                                        marginBottom: "12px",
                                    }}
                                >
                                    {service.title}
                                </h3>
                                <p style={{ fontSize: "clamp(0.875rem, 1.5vw, 1rem)", opacity: 0.95, lineHeight: 1.6 }}>
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Service Cards - Mobile Carousel */}
                    <div
                        style={{ position: "relative", marginTop: "48px", padding: "0 32px" }}
                        className="mobile-carousel"
                    >
                        <div style={{ overflow: "hidden" }}>
                            <div
                                style={{
                                    display: "flex",
                                    transition: "transform 0.5s ease-out",
                                    transform: `translateX(-${currentSlide * 100}%)`,
                                }}
                            >
                                {services.map((service, index) => (
                                    <div key={index} style={{ minWidth: "100%", padding: "0 16px" }}>
                                        <div
                                            style={{
                                                borderRadius: "24px",
                                                padding: "24px",
                                                minHeight: "224px",
                                                background: `linear-gradient(135deg, ${service.color}, ${service.color}cc)`,
                                                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    fontSize: "1.25rem",
                                                    fontWeight: "bold",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                {service.title}
                                            </h3>
                                            <p style={{ fontSize: "1rem", opacity: 0.95, lineHeight: 1.6 }}>
                                                {service.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <button
                            onClick={prevSlide}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                                border: "none",
                                borderRadius: "50%",
                                padding: "8px",
                                cursor: "pointer",
                                color: "#fff",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextSlide}
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                                border: "none",
                                borderRadius: "50%",
                                padding: "8px",
                                cursor: "pointer",
                                color: "#fff",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Dots Indicator */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
                            {services.map((service, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    style={{
                                        height: "8px",
                                        width: currentSlide === index ? "32px" : "8px",
                                        borderRadius: "4px",
                                        border: "none",
                                        background: currentSlide === index ? service.color : "rgba(255,255,255,0.3)",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "48px 16px",
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(20px)",
                }}
            >
                <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                    <h2
                        style={{
                            fontSize: "clamp(2rem, 4vw, 3.5rem)",
                            fontWeight: 800,
                            textAlign: "center",
                            marginBottom: "64px",
                            background: "linear-gradient(90deg, #34d399 0%, #3b82f6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Lợi ích nổi bật
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "48px",
                        }}
                    >
                        {benefits.map((benefit, index) => {
                            const Icon = benefit.icon;
                            return (
                                <div
                                    key={index}
                                    onMouseEnter={() => setHoveredBenefit(index)}
                                    onMouseLeave={() => setHoveredBenefit(null)}
                                    style={{
                                        textAlign: "center",
                                        padding: "24px",
                                        borderRadius: "24px",
                                        background: hoveredBenefit === index ? "rgba(255,255,255,0.08)" : "transparent",
                                        transition: "all 0.3s ease",
                                        transform: hoveredBenefit === index ? "scale(1.08)" : "scale(1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "clamp(96px, 15vw, 128px)",
                                            height: "clamp(96px, 15vw, 128px)",
                                            margin: "0 auto 24px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background:
                                                hoveredBenefit === index
                                                    ? `linear-gradient(135deg, ${benefit.color}, ${benefit.color}dd)`
                                                    : `conic-gradient(${benefit.color}, transparent, ${benefit.color})`,
                                            boxShadow:
                                                hoveredBenefit === index ? `0 20px 50px ${benefit.color}60` : "none",
                                            transition: "all 0.4s ease",
                                        }}
                                    >
                                        <Icon size={48} color="#fff" />
                                    </div>
                                    <h3
                                        style={{
                                            fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
                                            fontWeight: "bold",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        {benefit.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                            opacity: 0.9,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {benefit.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Contact Form Section */}
            <div style={{ position: "relative", zIndex: 1, padding: "48px 16px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "48px",
                            alignItems: "center",
                        }}
                    >
                        {/* Image Section */}
                        <div>
                            <div
                                style={{
                                    height: "clamp(250px, 40vw, 450px)",
                                    borderRadius: "24px",
                                    background: "linear-gradient(135deg, #2563eb 0%, #9333ea 100%)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                    boxShadow: "0 30px 80px rgba(37,99,235,0.4)",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2), transparent)",
                                    }}
                                />
                                <Headphones
                                    size={80}
                                    style={{ marginBottom: "16px", opacity: 0.9, position: "relative", zIndex: 1 }}
                                />
                                <h3
                                    style={{
                                        fontSize: "clamp(1.5rem, 3vw, 2rem)",
                                        fontWeight: 700,
                                        opacity: 0.95,
                                        position: "relative",
                                        zIndex: 1,
                                    }}
                                >
                                    Customer Support Team
                                </h3>
                                <p style={{ opacity: 0.8, marginTop: "8px", position: "relative", zIndex: 1 }}>
                                    Luôn sẵn sàng hỗ trợ bạn
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div>
                            <h2
                                style={{
                                    fontSize: "clamp(1.75rem, 4vw, 3rem)",
                                    fontWeight: 800,
                                    marginBottom: "16px",
                                }}
                            >
                                Yêu cầu demo
                            </h2>
                            <p
                                style={{
                                    fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                                    opacity: 0.9,
                                    marginBottom: "32px",
                                    lineHeight: 1.7,
                                }}
                            >
                                Với hơn 30 năm kinh nghiệm, DMS247 đồng hành cùng 11.500+ khách hàng trong hành trình số
                                hóa doanh nghiệp.
                            </p>

                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "24px",
                                    padding: "clamp(24px, 5vw, 40px)",
                                    boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <input
                                        type="text"
                                        placeholder="Công ty / Tổ chức *"
                                        value={formData.company}
                                        onChange={(e) => handleInputChange("company", e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                            color: "#111827",
                                            outline: "none",
                                            transition: "all 0.3s ease",
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Họ và tên *"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                            color: "#111827",
                                            outline: "none",
                                            transition: "all 0.3s ease",
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                    />
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: "16px",
                                        }}
                                    >
                                        <input
                                            type="email"
                                            placeholder="Email *"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                borderRadius: "12px",
                                                border: "1px solid #d1d5db",
                                                fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                                color: "#111827",
                                                outline: "none",
                                                transition: "all 0.3s ease",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Điện thoại *"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                borderRadius: "12px",
                                                border: "1px solid #d1d5db",
                                                fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                                color: "#111827",
                                                outline: "none",
                                                transition: "all 0.3s ease",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Mô tả nhu cầu của bạn *"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        rows="4"
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "clamp(0.95rem, 1.5vw, 1rem)",
                                            color: "#111827",
                                            outline: "none",
                                            resize: "none",
                                            fontFamily: "inherit",
                                            transition: "all 0.3s ease",
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                    />

                                    <label
                                        style={{ display: "flex", alignItems: "start", gap: "12px", cursor: "pointer" }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.agreement}
                                            onChange={(e) => handleInputChange("agreement", e.target.checked)}
                                            style={{
                                                marginTop: "4px",
                                                width: "20px",
                                                height: "20px",
                                                cursor: "pointer",
                                            }}
                                        />
                                        <span
                                            style={{
                                                color: "#374151",
                                                fontSize: "clamp(0.85rem, 1.2vw, 0.95rem)",
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Tôi đồng ý chia sẻ thông tin và chấp nhận Chính sách bảo mật
                                        </span>
                                    </label>

                                    <button
                                        disabled={!formData.agreement}
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: "none",
                                            fontWeight: "bold",
                                            fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
                                            color: "#fff",
                                            background: formData.agreement
                                                ? "linear-gradient(90deg, #f97316, #ef4444)"
                                                : "#d1d5db",
                                            cursor: formData.agreement ? "pointer" : "not-allowed",
                                            transition: "all 0.3s ease",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            boxShadow: formData.agreement ? "0 10px 30px rgba(239,68,68,0.4)" : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (formData.agreement) {
                                                e.currentTarget.style.background =
                                                    "linear-gradient(90deg, #ef4444, #dc2626)";
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 15px 40px rgba(239,68,68,0.5)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (formData.agreement) {
                                                e.currentTarget.style.background =
                                                    "linear-gradient(90deg, #f97316, #ef4444)";
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(239,68,68,0.4)";
                                            }
                                        }}
                                    >
                                        Đăng ký ngay
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.1); }
        }
        @media (min-width: 768px) {
          .desktop-grid {
            display: grid !important;
          }
          .mobile-carousel {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default ProductPage;
