const DEVICE_CATALOG = {
  "macbook-neo": {
    name: "MacBook Neo",
    family: "Laptop · Standard issue",
    image: "images/macbook-neo.png",
    summary: "Entry Apple silicon notebook for general productivity, email, and browser work.",
    specs: [
      ["Role", "ACME entry standard-issue laptop"],
      ["Chip", "Apple silicon (entry configuration)"],
      ["Memory", "16GB unified memory"],
      ["Storage", "256GB SSD"],
      ["Display", "13.6-inch Liquid Retina, 2560-by-1664"],
      ["Battery", "All-day wireless web for typical office use"],
      ["Ports", "MagSafe 3, two Thunderbolt / USB-C, headphone jack"],
      ["Weight", "About 2.7 lb"],
      ["Best for", "General productivity, ticket work, and shared-pool replacements"]
    ]
  },
  "macbook-air-13": {
    name: "MacBook Air 13-inch (M5)",
    family: "Laptop · Standard issue",
    image: "images/macbook-air-13.png",
    summary: "Lightweight daily driver. Starts at $1,099.",
    specs: [
      ["Chip", "Apple M5, 10-core CPU, 8-core GPU (configurable 10-core GPU)"],
      ["Memory", "16GB unified memory, configurable to 24GB or 32GB"],
      ["Storage", "512GB SSD, configurable to 1TB, 2TB, or 4TB"],
      ["Display", "13.6-inch Liquid Retina, 2560-by-1664, 224 ppi, 500 nits"],
      ["Battery", "Up to 18 hours video streaming; 53.8-watt-hour battery"],
      ["Charging", "MagSafe 3, 40W Dynamic Power Adapter"],
      ["Ports", "MagSafe 3, two Thunderbolt 4 (USB-C), 3.5 mm headphone jack"],
      ["Wireless", "Wi-Fi 7, Bluetooth 6, Apple N1"],
      ["Camera", "12MP Center Stage with Desk View"],
      ["Size / weight", "0.44 × 11.97 × 8.46 in, 2.7 lb"],
      ["Starting price", "$1,099"]
    ]
  },
  "macbook-air-15": {
    name: "MacBook Air 15-inch (M5)",
    family: "Laptop · Standard issue",
    image: "images/macbook-air-15.png",
    summary: "Larger canvas, same thin Air design. Starts at $1,299.",
    specs: [
      ["Chip", "Apple M5, 10-core CPU, 10-core GPU"],
      ["Memory", "16GB unified memory, configurable to 24GB or 32GB"],
      ["Storage", "512GB SSD, configurable to 1TB, 2TB, or 4TB"],
      ["Display", "15.3-inch Liquid Retina, 2880-by-1864, 224 ppi, 500 nits"],
      ["Battery", "Up to 18 hours video streaming"],
      ["Charging", "MagSafe 3"],
      ["Ports", "MagSafe 3, two Thunderbolt 4 (USB-C), 3.5 mm headphone jack"],
      ["Wireless", "Wi-Fi 7, Bluetooth 6, Apple N1"],
      ["Camera", "12MP Center Stage with Desk View"],
      ["Cooling", "Fanless"],
      ["Starting price", "$1,299"]
    ]
  },
  "macbook-pro-14": {
    name: "MacBook Pro 14-inch (M5)",
    family: "Laptop · Developer / creator",
    image: "images/macbook-pro-14.png",
    summary: "Pro display and ports for developers and creators. Starts at $1,699.",
    specs: [
      ["Chip", "Apple M5, 10-core CPU, 10-core GPU"],
      ["Memory", "16GB unified memory, configurable to 24GB or 32GB"],
      ["Storage", "512GB or 1TB SSD, configurable to 4TB"],
      ["Display", "14.2-inch Liquid Retina XDR, 3024-by-1964, ProMotion 120Hz"],
      ["Brightness", "1000 nits SDR, 1600 nits peak HDR"],
      ["Battery", "Up to 24 hours video streaming; 72.4-watt-hour battery"],
      ["Charging", "70W USB-C Power Adapter, MagSafe 3"],
      ["Ports", "MagSafe 3, three Thunderbolt 4, HDMI, SDXC, headphone jack"],
      ["Wireless", "Wi-Fi 6E, Bluetooth 5.3"],
      ["Camera", "12MP Center Stage with Desk View"],
      ["Weight", "3.4 lb"],
      ["Starting price", "$1,699"]
    ]
  },
  "macbook-pro-16": {
    name: "MacBook Pro 16-inch (M5 Pro / Max)",
    family: "Laptop · Heavy compile, media, AI",
    image: "images/macbook-pro-16.png",
    summary: "Largest MacBook for heavy compile, media, and AI workloads.",
    specs: [
      ["Chip", "Apple M5 Pro (18-core CPU, 20-core GPU) or M5 Max (18-core CPU, 32- or 40-core GPU)"],
      ["Memory", "24GB unified memory, configurable up to 128GB on M5 Max"],
      ["Storage", "1TB SSD typical; configurable to 2TB, 4TB, or 8TB on M5 Max"],
      ["Display", "16.2-inch Liquid Retina XDR, 3456-by-2234, 254 ppi, ProMotion 120Hz"],
      ["Battery", "Up to 24 hours video streaming (M5 Pro); 100-watt-hour battery"],
      ["Charging", "140W USB-C Power Adapter, MagSafe 3"],
      ["Ports", "MagSafe 3, Thunderbolt 5, HDMI, SDXC, headphone jack"],
      ["Wireless", "Wi-Fi 7"],
      ["Starting price", "M5 Pro from $2,699"]
    ]
  },
  "iphone-17": {
    name: "iPhone 17",
    family: "Mobile · Standard issue",
    image: "images/iphone-17.png",
    summary: "Standard-issue iPhone 17. Starts at $899.",
    specs: [
      ["Chip", "A19, 6-core CPU, 5-core GPU, 16-core Neural Engine"],
      ["Display", "6.3-inch Super Retina XDR OLED, 2622-by-1206, ProMotion 120Hz, Always-On"],
      ["Capacity", "256GB or 512GB"],
      ["Rear camera", "48MP Dual Fusion: main + ultra wide, 2x optical-quality telephoto"],
      ["Front camera", "18MP Center Stage"],
      ["Battery", "Up to 30 hours video playback"],
      ["Charging", "USB-C, MagSafe / Qi2 up to 25W"],
      ["Wireless", "5G, Wi-Fi 7, Bluetooth 6, Apple N1"],
      ["Resistance", "IP68"],
      ["Size / weight", "5.89 × 2.81 × 0.31 in, 6.24 oz"],
      ["Starting price", "$899"]
    ]
  },
  "iphone-17e": {
    name: "iPhone 17e",
    family: "Mobile · Value issue",
    image: "images/iphone-17e.png",
    summary: "Value 17-series option for voice and mail-first roles. Starts at $699.",
    specs: [
      ["Chip", "A19, 6-core CPU, 4-core GPU, 16-core Neural Engine"],
      ["Display", "6.1-inch Super Retina XDR OLED, 2532-by-1170"],
      ["Capacity", "256GB or 512GB"],
      ["Rear camera", "48MP Fusion main with 2x optical-quality telephoto"],
      ["Battery", "Up to 26 hours video playback"],
      ["Charging", "USB-C"],
      ["Wireless", "5G (sub-6 GHz), Wi-Fi 6, Bluetooth 5.3, Apple C1X modem"],
      ["SIM", "Dual eSIM"],
      ["Starting price", "$699"]
    ]
  },
  "iphone-air": {
    name: "iPhone Air",
    family: "Mobile · Travel",
    image: "images/iphone-air.png",
    summary: "Ultra-thin 17-generation iPhone for travel-heavy staff. Starts at $1,099.",
    specs: [
      ["Chip", "A19 Pro, 6-core CPU, 5-core GPU, 16-core Neural Engine"],
      ["Display", "6.5-inch Super Retina XDR OLED, 2736-by-1260, ProMotion 120Hz, Always-On"],
      ["Capacity", "256GB to 1TB"],
      ["Rear camera", "48MP Fusion main with 2x optical-quality telephoto"],
      ["Front camera", "18MP Center Stage"],
      ["Battery", "Up to 27 hours video playback"],
      ["Wireless", "5G, Wi-Fi 7, Bluetooth 6, Apple N1"],
      ["Design", "Thinnest iPhone; travel-weight unibody"],
      ["Starting price", "$1,099"]
    ]
  },
  "iphone-18-pro": {
    name: "iPhone 18 Pro",
    family: "Mobile · Pro flagship",
    image: "images/iphone-18-pro.png",
    summary: "Current Pro flagship with A20 Pro. Starts at $1,199.",
    specs: [
      ["Chip", "A20 Pro, 6-core CPU, 7-core GPU, dual 16-core Neural Engine"],
      ["Display", "6.3-inch Super Retina XDR OLED, 2622-by-1206, ProMotion 120Hz"],
      ["Capacity", "256GB to 2TB"],
      ["Rear camera", "Triple 48MP Fusion system with variable-aperture main"],
      ["Battery", "Up to 36 hours video playback"],
      ["Charging", "USB-C; up to 50% in about 15 minutes with 60W-class adapter"],
      ["Wireless", "5G (sub-6 and mmWave), Wi-Fi 7, Bluetooth 6, Apple C2 modem"],
      ["Starting price", "$1,199"]
    ]
  },
  "iphone-18-pro-max": {
    name: "iPhone 18 Pro Max",
    family: "Mobile · Field / exec",
    image: "images/iphone-18-pro-max.png",
    summary: "Largest 18 Pro for field and exec use. Starts at $1,299.",
    specs: [
      ["Chip", "A20 Pro, 6-core CPU, 7-core GPU, dual 16-core Neural Engine"],
      ["Display", "6.9-inch Super Retina XDR OLED, 2868-by-1320, ProMotion 120Hz"],
      ["Capacity", "256GB to 2TB"],
      ["Rear camera", "Triple 48MP Fusion system, 8x optical-quality zoom"],
      ["Battery", "Up to 45 hours video playback"],
      ["Charging", "USB-C; up to 50% in about 15 minutes with 60W-class adapter"],
      ["Wireless", "5G (sub-6 and mmWave), Wi-Fi 7, Bluetooth 6, Apple C2 modem"],
      ["Starting price", "$1,299"]
    ]
  }
};
