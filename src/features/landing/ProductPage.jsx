import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Stack,
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Language as LanguageIcon,
  MonetizationOn as MonetizationOnIcon,
  Support as SupportIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

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

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "agreement" ? event.target.checked : event.target.value,
    }));
  };

  const services = [
    {
      title: "Full stack",
      description:
        "Công cụ quản lý toàn diện, hỗ trợ xử lý sự cố, tối ưu dịch vụ với giải pháp chuẩn hóa.",
      color: "#FF8C00",
    },
    {
      title: "Self service",
      description:
        "Cho phép người dùng tự tạo yêu cầu dịch vụ, tra cứu & xử lý vấn đề đơn giản.",
      color: "#4A90E2",
    },
    {
      title: "Cấu hình tự động",
      description:
        "Giúp nhà cung cấp dịch vụ quản lý nhanh chóng với cấu hình tiêu chuẩn và tự động hóa.",
      color: "#5A6ACF",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", sans-serif',
        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {/* Hero Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.5rem", md: "3.8rem" },
                mb: 2,
                background: "linear-gradient(90deg, #60a5fa, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tính năng chính
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              Giải pháp công nghệ tối ưu cho doanh nghiệp của bạn
            </Typography>
          </motion.div>

          {/* Service Cards */}
          <Box sx={{ position: "relative", mt: 8 }}>
            <Grid container spacing={3} justifyContent="center">
              {services.map((service, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Card
                      sx={{
                        height: 220,
                        background:
                          index === currentSlide
                            ? `linear-gradient(135deg, ${service.color}, ${service.color}80)`
                            : "rgba(255,255,255,0.05)",
                        border: index === currentSlide
                          ? `2px solid ${service.color}`
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        backdropFilter: "blur(10px)",
                      }}
                      onClick={() => setCurrentSlide(index)}
                    >
                      <CardContent sx={{ p: 3, height: "100%" }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                          {service.title}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.85 }}>
                          {service.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Navigation Arrows */}
            <Button
              onClick={prevSlide}
              sx={{
                position: "absolute",
                left: -20,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                '&:hover': { background: "rgba(255,255,255,0.3)" },
              }}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              onClick={nextSlide}
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                '&:hover': { background: "rgba(255,255,255,0.3)" },
              }}
            >
              <ChevronRightIcon />
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: "rgba(255,255,255,0.05)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              textAlign: "center",
              mb: 6,
              background: "linear-gradient(90deg, #34d399, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Lợi ích nổi bật
          </Typography>

          <Grid container spacing={6}>
            {[
              {
                icon: <LanguageIcon sx={{ fontSize: 50 }} />,
                title: "Sản phẩm Việt cho người Việt",
                description:
                  "Giao diện thân thiện, ngôn ngữ Tiếng Việt và tính năng phù hợp doanh nghiệp Việt Nam.",
                color: "#3b82f6",
              },
              {
                icon: <MonetizationOnIcon sx={{ fontSize: 50 }} />,
                title: "Tiết kiệm chi phí",
                description:
                  "Tối ưu đến 50% chi phí license hợp lý cùng tính năng mạnh mẽ.",
                color: "#f59e0b",
              },
              {
                icon: <SupportIcon sx={{ fontSize: 50 }} />,
                title: "Hỗ trợ 24/7",
                description:
                  "Đội ngũ chuyên gia hỗ trợ nhanh chóng, mọi lúc mọi nơi.",
                color: "#10b981",
              },
            ].map((benefit, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div whileHover={{ scale: 1.08 }}>
                  <Box sx={{ textAlign: "center", p: 3 }}>
                    <Box
                      sx={{
                        width: 110,
                        height: 110,
                        borderRadius: "50%",
                        background: `conic-gradient(${benefit.color}, transparent, ${benefit.color})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 3,
                      }}
                    >
                      <Box sx={{ color: benefit.color }}>{benefit.icon}</Box>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {benefit.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Form Section */}
      <Box sx={{ py: { xs: 10, md: 15 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                <Box
                  sx={{
                    height: 400,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #2563eb, #9333ea)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ opacity: 0.9 }}>
                    Customer Support Team
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} lg={6}>
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
                  Yêu cầu demo
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.85 }}>
                  Với hơn 30 năm kinh nghiệm, DMS247 đồng hành cùng 11.500+ khách hàng
                  trong hành trình số hóa doanh nghiệp.
                </Typography>

                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: "#fff",
                    color: "#000",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                  }}
                >
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      placeholder="Công ty / Tổ chức *"
                      value={formData.company}
                      onChange={handleInputChange("company")}
                    />
                    <TextField
                      fullWidth
                      placeholder="Họ và tên *"
                      value={formData.name}
                      onChange={handleInputChange("name")}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          placeholder="Email *"
                          value={formData.email}
                          onChange={handleInputChange("email")}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          placeholder="Điện thoại *"
                          value={formData.phone}
                          onChange={handleInputChange("phone")}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Mô tả nhu cầu của bạn *"
                      value={formData.description}
                      onChange={handleInputChange("description")}
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.agreement}
                          onChange={handleInputChange("agreement")}
                          sx={{ color: "#2563eb" }}
                        />
                      }
                      label="Tôi đồng ý chia sẻ thông tin và chấp nhận Chính sách bảo mật"
                    />

                    <Button
                      variant="contained"
                      size="large"
                      disabled={!formData.agreement}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: "linear-gradient(90deg, #f97316, #ef4444)",
                        color: "#fff",
                        borderRadius: 25,
                        fontWeight: 700,
                        py: 1.5,
                        '&:hover': {
                          background: "linear-gradient(90deg, #ef4444, #f97316)",
                        },
                      }}
                    >
                      Đăng ký ngay
                    </Button>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ProductPage;