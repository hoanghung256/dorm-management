import React, { useState } from "react";
import "../../styles/landingPage.css";

const LandingPage = () => {
    const [activeChallenge, setActiveChallenge] = useState(0);

    const challengesSolutions = [
        {
            challenge: {
                title: "Thiếu nhắc nhở hợp đồng và hạn đóng phí",
                description:
                    "Người thuê dễ quên hạn hợp đồng hoặc đóng tiền trọ muộn, gây rắc rối cho cả quản lý và người ở.",
            },
            solution: {
                title: "Tự động nhắc nhở",
                description:
                    "Hệ thống gửi thông báo qua email, SMS hoặc app khi sắp đến hạn hợp đồng hoặc hạn nộp tiền.",
            },
        },
        {
            challenge: {
                title: "Quản lý thủ công bằng giấy tờ / Excel",
                description:
                    "Chia sẻ tiền điện, nước, internet giữa các bạn cùng phòng thường gây tranh cãi và không minh bạch.",
            },
            solution: {
                title: "Quản lý tài chính và công nợ thiếu minh bạch",
                description:
                    "Tự động tính toán và phân chia chi phí theo tỷ lệ công bằng, minh bạch 100%. Theo dõi chi tiêu và tạo báo cáo chi tiết.",
            },
        },
        {
            challenge: {
                title: "Giao tiếp kém hiệu quả",
                description: "Thông báo quan trọng thường bị bỏ sót, tạo ra hiểu lầm và căng thẳng không đáng có.",
            },
            solution: {
                title: "Nền tảng giao tiếp hiện đại",
                description:
                    "Thông báo push và hệ thống nhắc nhở tự động giúp mọi người luôn cập nhật thông tin quan trọng.",
            },
        },
    ];

    return (
        <div className="homepage-container" style={{ margin: 0, padding: 0 }}>
            <section id="home" className="homepage-hero">
                <div className="homepage-content">
                    <h1>Quản Lý Phòng Trọ Thông Minh</h1>
                    <div className="subtitle">Giải pháp toàn diện cho cuộc sống tập thể hiện đại</div>
                    <p>
                        DMS mang đến trải nghiệm quản lý phòng trọ hoàn toàn mới với công nghệ AI, giúp tối ưu hóa chi
                        phí, tăng cường giao tiếp và xây dựng cộng đồng sinh viên văn minh.
                    </p>
                    <div className="homepage-cta">
                        <a href="/login-callback" className="homepage-button-primary">
                            Bắt đầu ngay
                            <span></span>
                        </a>
                        <a href="/product" className="homepage-button-secondary">
                            Xem tính năng
                        </a>
                        <a href="#about" className="homepage-button-secondary">
                            Tìm hiểu thêm
                        </a>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="stats-container">
                    <div className="stat-item">
                        <div className="stat-number">95%</div>
                        <div className="stat-label">Hài lòng</div>
                        <div className="stat-description">Sinh viên cảm thấy hài lòng với dịch vụ</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50%</div>
                        <div className="stat-label">Tiết kiệm</div>
                        <div className="stat-description">Giảm thời gian quản lý hành chính</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">24/7</div>
                        <div className="stat-label">Hỗ trợ</div>
                        <div className="stat-description">Dịch vụ chăm sóc khách hàng liên tục</div>
                    </div>
                </div>
            </section>

            <section id="about" className="about-section">
                <div className="about-header">
                    <h1>
                        Đồng hành cùng <span className="highlight-text">cuộc sống</span> của bạn
                    </h1>
                </div>

                <div className="about-content">
                    <div className="challenges-solutions-container">
                        <div className="challenges-section">
                            <div className="section-subtitle">THÁCH THỨC CỦA BẠN</div>
                            {challengesSolutions.map((item, index) => (
                                <div
                                    key={index}
                                    className={`challenge-item ${activeChallenge === index ? "active" : ""}`}
                                    onClick={() => setActiveChallenge(index)}
                                >
                                    <h4>{item.challenge.title}</h4>
                                    <p>{item.challenge.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="solutions-section">
                            <div className="section-subtitle">GIẢI PHÁP CỦA CHÚNG TÔI</div>
                            <div className="solution-card active-solution">
                                <h4>{challengesSolutions[activeChallenge].solution.title}</h4>
                                <p>{challengesSolutions[activeChallenge].solution.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="about-images">
                        <img
                            src="https://cdn.home-designing.com/wp-content/uploads/2019/09/modern-nordic-dorm-style-bedroom-design.jpg"
                            alt="Modern Dormitory"
                        />
                        <img
                            src="https://www.roanoke.edu/images/StudentLife/Housing/ches_800w.jpg"
                            alt="Student Living"
                        />
                        <img
                            src="https://tse1.explicit.bing.net/th/id/OIP.EuUGCK4A9ygcC1adjEGU6gHaFj?rs=1&pid=ImgDetMain&o=7&rm=3"
                            alt="Community Space"
                        />
                        <img
                            src="https://www.harringtonhousing.com/uploads/0003/3066/2023/01/12/efficient-studying-methods-for-college-students.jpg"
                            alt="Happy Students"
                        />
                    </div>
                </div>
            </section>

            {/* Contact Section - Like Figma Design */}
            <section id="contact" className="contact-section">
                <div className="contact-container">
                    <div className="contact-content">
                        <div className="contact-form-wrapper">
                            <h2>Liên hệ</h2>
                            <p>
                                Bạn có thắc mắc, phản hồi hoặc cần hỗ trợ? Chúng tôi luôn sẵn sàng giúp bạn! Hãy liên hệ
                                với nhóm của chúng tôi bất cứ lúc nào, chúng tôi rất muốn lắng nghe bạn.
                            </p>

                            <form className="contact-form">
                                <div className="form-row">
                                    <input type="text" placeholder="Họ và tên*" className="form-input" required />
                                </div>

                                <div className="form-row">
                                    <input type="email" placeholder="Email" className="form-input" />
                                </div>

                                <div className="form-row">
                                    <input type="tel" placeholder="Số điện thoại*" className="form-input" required />
                                </div>

                                <div className="form-row">
                                    <select className="form-select">
                                        <option>Bạn tìm thấy chúng tôi bằng cách nào?</option>
                                        <option>Tìm kiếm Google</option>
                                        <option>Mạng xã hội</option>
                                        <option>Bạn bè giới thiệu</option>
                                        <option>Khác</option>
                                    </select>
                                </div>

                                <button type="submit" className="contact-submit-btn">
                                    GỬI
                                </button>
                            </form>

                            <div className="contact-info-bar">
                                <div className="contact-info-item">
                                    <span className="contact-icon">📞</span>
                                    <div>
                                        <div className="contact-label">Số điện thoại</div>
                                        <div className="contact-value">0886 059 979</div>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <span className="contact-icon">📠</span>
                                    <div>
                                        <div className="contact-label">FAX</div>
                                        <div className="contact-value">000000000</div>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <span className="contact-icon">✉️</span>
                                    <div>
                                        <div className="contact-label">EMAIL</div>
                                        <div className="contact-value">tubbiestech@gmail.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-map-wrapper">
                            <div className="contact-map">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d958.9647368680196!2d108.26056270960133!3d15.96874080719823!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2s!4v1758640793412!5m2!1svi!2s"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, borderRadius: "20px" }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="DMS Location"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
