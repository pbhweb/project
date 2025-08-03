// Uber-Style Main JavaScript with Multi-language and Multi-currency support
const currencies = {
  ar: { code: "SAR", symbol: "ر.س" },
  en: { code: "USD", symbol: "$" },
  pk: { code: "PKR", symbol: "₨" },
  in: { code: "INR", symbol: "₹" },
  cn: { code: "CNY", symbol: "¥" },
  eu: { code: "EUR", symbol: "€" },
  br: { code: "BRL", symbol: "R$" },
}

const translations = {
  ar: {
    services: "خدماتنا",
    about: "معلومات عنا",
    contact: "اتصل بنا",
    driver_portal: "لوحة سائق",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    hero_title_main: "رحلتك بسهولة",
    hero_title_sub: "اختر وجهتك وابدأ رحلتك",
    hero_description: "نحن نقدم أفضل الخدمات لرحلاتك",
    quick_arrival: "وصول سريع",
    safe_ride: "رحلة آمنة",
    fair_prices: "أسعار معقولة",
    book_now: "احجز الآن",
    ride: "رحلة",
    delivery: "توصيل",
    ride_type: "نوع الرحلة",
    payment_method: "طريقة الدفع",
    book_ride: "احجز رحلة",
    economy: "اقتصادي",
    comfort: "مريح",
    premium: "ممتاز",
    cash: "النقد",
    card: "البطاقة",
    wallet: "المحف",
    estimated_distance: "المسافة المقدرة",
    estimated_time: "الوقت المقدر",
    total_cost: "السعر الكلي",
    our_services: "خدماتنا",
    services_subtitle: "نحن نقدم مجموعة متنوعة من الخدمات",
    daily_rides: "رحلات يومية",
    daily_rides_desc: "رحلات موثوقة وآمنة على مدار الساعة",
    airport_transfer: "نقل من/إلى المطار",
    airport_transfer_desc: "خدمة توصيل سريعة وآمنة من/إلى المطار",
    delivery_service: "خدمة التوصيل",
    delivery_service_desc: "توصيل بضائع بسرعة وسهولة",
    group_rides: "رحلات مجموعات",
    group_rides_desc: "رحلات مخصصة للمجموعات",
    why_choose_us: "لماذا نحن؟",
    safety_reliability: "السلامة والموثوقية",
    safety_desc: "نحن نضمن رحلتك بأمان وموثوقية",
    quick_arrival_feature: "وصول سريع",
    quick_arrival_desc: "سائق سيصل إليك في أقل من 5 دقائق",
    transparent_pricing: "الأسعار الشفافة",
    transparent_pricing_desc: "أسعار معقولة وشفافة تلبي احتياجاتك",
    driver_rating: "تقييم السائقين",
    driver_rating_desc: "تقييمات من العملاء السابقين تساعدك في اختيار السائق الأمثل",
    start_journey: "ابدأ رحلتك",
    cta_description: "احجز رحلتك الآن وابدأ رحلتك بسهولة",
    book_ride_cta: "احجز رحلة",
    join_driver: "انضم كسائق",
    footer_description: "جميع الحقوق محفوظة",
    company: "شركة أوبير",
    about_us: "معلومات عنا",
    careers: "فرص العمل",
    news: "أخبارنا",
    investors: "المستثمرون",
    support: "الدعم",
    help_center: "مركز المساعدة",
    contact_us: "اتصل بنا",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    all_rights_reserved: "جميع الحقوق محفوظة",
    cookies: "الكوكيز",
    login_title: "تسجيل الدخول",
    register_title: "إنشاء حساب",
    full_name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    mobile: "رقم الهاتف",
    password: "كلمة المرور",
    forgot_password: "هل نسيت كلمة المرور؟",
    login_success: "تم تسجيل الدخول بنجاح",
    register_success: "تم إنشاء الحساب بنجاح",
    booking: "جاري الحجز...",
    booking_success: "تم الحجز بنجاح",
    booking_failed: "فشل في الحجز",
    searching_driver: "جاري البحث عن سائق...",
    driver_found: "تم العثور على سائق",
    driver_arrived: "وصل السائق",
    ride_in_progress: "رحلة قيد التنفيذ",
    ride_completed: "تم إتمام الرحلة",
    ride_cancelled: "تم إلغاء الرحلة",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    logout_success: "تم تسجيل الخروج بنجاح",
    from: "من",
    to: "إلى",
    estimated_fare: "السعر المقدر",
    driver_info: "معلومات السائق",
    call: "اتصال",
  },
  en: {
    services: "Our Services",
    about: "About Us",
    contact: "Contact Us",
    driver_portal: "Driver Portal",
    login: "Login",
    register: "Register",
    hero_title_main: "Your Journey Made Easy",
    hero_title_sub: "Choose Your Destination and Start Your Journey",
    hero_description: "We offer the best services for your journeys",
    quick_arrival: "Quick Arrival",
    safe_ride: "Safe Ride",
    fair_prices: "Fair Prices",
    book_now: "Book Now",
    ride: "Ride",
    delivery: "Delivery",
    ride_type: "Ride Type",
    payment_method: "Payment Method",
    book_ride: "Book Ride",
    economy: "Economy",
    comfort: "Comfort",
    premium: "Premium",
    cash: "Cash",
    card: "Card",
    wallet: "Wallet",
    estimated_distance: "Estimated Distance",
    estimated_time: "Estimated Time",
    total_cost: "Total Cost",
    our_services: "Our Services",
    services_subtitle: "We offer a wide range of services",
    daily_rides: "Daily Rides",
    daily_rides_desc: "Reliable and safe rides 24/7",
    airport_transfer: "Airport Transfer",
    airport_transfer_desc: "Fast and safe transfer to/from the airport",
    delivery_service: "Delivery Service",
    delivery_service_desc: "Fast and easy delivery service",
    group_rides: "Group Rides",
    group_rides_desc: "Customized rides for groups",
    why_choose_us: "Why Choose Us?",
    safety_reliability: "Safety and Reliability",
    safety_desc: "We ensure your journey is safe and reliable",
    quick_arrival_feature: "Quick Arrival",
    quick_arrival_desc: "Driver will arrive in less than 5 minutes",
    transparent_pricing: "Transparent Pricing",
    transparent_pricing_desc: "Fair prices that meet your needs",
    driver_rating: "Driver Ratings",
    driver_rating_desc: "Customer ratings help you choose the best driver",
    start_journey: "Start Your Journey",
    cta_description: "Book your journey now and start easily",
    book_ride_cta: "Book Ride",
    join_driver: "Join as Driver",
    footer_description: "All rights reserved",
    company: "Uber Company",
    about_us: "About Us",
    careers: "Careers",
    news: "News",
    investors: "Investors",
    support: "Support",
    help_center: "Help Center",
    contact_us: "Contact Us",
    terms: "Terms and Conditions",
    privacy: "Privacy Policy",
    all_rights_reserved: "All rights reserved",
    cookies: "Cookies",
    login_title: "Login",
    register_title: "Register",
    full_name: "Full Name",
    email: "Email",
    mobile: "Mobile",
    password: "Password",
    forgot_password: "Forgot Password?",
    login_success: "Login Successful",
    register_success: "Registration Successful",
    booking: "Booking...",
    booking_success: "Booking Successful",
    booking_failed: "Booking Failed",
    searching_driver: "Searching for driver...",
    driver_found: "Driver Found",
    driver_arrived: "Driver Arrived",
    ride_in_progress: "Ride in Progress",
    ride_completed: "Ride Completed",
    ride_cancelled: "Ride Cancelled",
    welcome: "Welcome",
    logout: "Logout",
    logout_success: "Logout Successful",
    from: "From",
    to: "To",
    estimated_fare: "Estimated Fare",
    driver_info: "Driver Info",
    call: "Call",
  },
}

const rtlLanguages = ["ar"]

class UberTaxiApp {
  constructor() {
    this.currentUser = null
    this.currentRide = null
    this.pickupLocation = null
    this.dropoffLocation = null
    this.selectedRideType = "economy"
    this.selectedPaymentMethod = "cash"
    this.rideStatusInterval = null
    this.currentLanguage = localStorage.getItem("preferred_language") || "ar"
    this.currentCurrency = currencies[this.currentLanguage] || currencies["ar"]

    this.init()
  }

  init() {
    this.bindEvents()
    this.initializeAnimations()
    this.checkAuthStatus()
    this.updateLanguage()
    this.updateCurrency()
    this.setDirection()
  }

  bindEvents() {
    // Mobile menu toggle
    const mobileToggle = document.querySelector(".mobile-menu-toggle")
    if (mobileToggle) {
      mobileToggle.addEventListener("click", this.toggleMobileMenu.bind(this))
    }

    // Language selector
    const languageSelector = document.getElementById("language-selector")
    if (languageSelector) {
      languageSelector.value = this.currentLanguage
      languageSelector.addEventListener("change", (e) => {
        this.setLanguage(e.target.value)
      })
    }

    // Auth buttons
    const loginBtn = document.getElementById("login-btn")
    const registerBtn = document.getElementById("register-btn")

    if (loginBtn) loginBtn.addEventListener("click", () => this.showModal("login-modal"))
    if (registerBtn) registerBtn.addEventListener("click", () => this.showModal("register-modal"))

    // Modal close buttons
    document.querySelectorAll(".modal-close, .modal-overlay").forEach((element) => {
      element.addEventListener("click", (e) => {
        if (e.target === element) {
          this.hideAllModals()
        }
      })
    })

    // Booking tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Location inputs
    const pickupInput = document.getElementById("pickup-input")
    const dropoffInput = document.getElementById("dropoff-input")

    if (pickupInput) {
      pickupInput.addEventListener("input", this.debounce(this.handlePickupInput.bind(this), 500))
    }

    if (dropoffInput) {
      dropoffInput.addEventListener("input", this.debounce(this.handleDropoffInput.bind(this), 500))
    }

    // Current location button
    const currentLocationBtn = document.getElementById("current-location-btn")
    if (currentLocationBtn) {
      currentLocationBtn.addEventListener("click", this.getCurrentLocation.bind(this))
    }

    // Swap locations button
    const swapBtn = document.querySelector(".swap-locations-btn")
    if (swapBtn) {
      swapBtn.addEventListener("click", this.swapLocations.bind(this))
    }

    // Ride type selection
    document.querySelectorAll(".ride-type").forEach((type) => {
      type.addEventListener("click", (e) => {
        this.selectRideType(e.currentTarget.dataset.type)
      })
    })

    // Payment method selection
    document.querySelectorAll(".payment-method").forEach((method) => {
      method.addEventListener("click", (e) => {
        this.selectPaymentMethod(e.currentTarget.dataset.method)
      })
    })

    // Booking form
    const bookingForm = document.getElementById("booking-form")
    if (bookingForm) {
      bookingForm.addEventListener("submit", this.handleBooking.bind(this))
    }

    // Auth forms
    const loginForm = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")

    if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this))
    if (registerForm) registerForm.addEventListener("submit", this.handleRegister.bind(this))

    // CTA buttons
    const ctaBookBtn = document.getElementById("cta-book-btn")
    const ctaDriverBtn = document.getElementById("cta-driver-btn")

    if (ctaBookBtn) {
      ctaBookBtn.addEventListener("click", () => {
        document.querySelector(".hero").scrollIntoView({ behavior: "smooth" })
        document.getElementById("pickup-input").focus()
      })
    }

    if (ctaDriverBtn) {
      ctaDriverBtn.addEventListener("click", () => {
        window.location.href = "driver.html"
      })
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute("href"))
        if (target) {
          target.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }

  setLanguage(language) {
    this.currentLanguage = language
    this.currentCurrency = currencies[language] || currencies["ar"]
    localStorage.setItem("preferred_language", language)

    this.updateLanguage()
    this.updateCurrency()
    this.setDirection()
    this.calculateFare() // Recalculate with new currency
  }

  updateLanguage() {
    const t = translations[this.currentLanguage] || translations["ar"]

    // Update all translatable elements
    const translatableElements = document.querySelectorAll("[data-translate]")
    translatableElements.forEach((element) => {
      const key = element.getAttribute("data-translate")
      if (t[key]) {
        if (element.tagName === "INPUT" && element.type !== "submit") {
          element.placeholder = t[key]
        } else {
          element.textContent = t[key]
        }
      }
    })

    // Update specific elements by ID
    const elementsToUpdate = {
      // Navigation
      "nav-services": t.services,
      "nav-about": t.about,
      "nav-contact": t.contact,
      "nav-driver": t.driver_portal,
      "login-btn": t.login,
      "register-btn": t.register,

      // Hero section
      "hero-title-main": t.hero_title_main,
      "hero-title-sub": t.hero_title_sub,
      "hero-description": t.hero_description,
      "feature-quick": t.quick_arrival,
      "feature-safe": t.safe_ride,
      "feature-price": t.fair_prices,

      // Booking form
      "booking-title": t.book_now,
      "tab-ride": t.ride,
      "tab-delivery": t.delivery,
      "ride-type-label": t.ride_type,
      "payment-method-label": t.payment_method,
      "book-ride-btn-text": t.book_ride,

      // Ride types
      "economy-name": t.economy,
      "comfort-name": t.comfort,
      "premium-name": t.premium,

      // Payment methods
      "cash-text": t.cash,
      "card-text": t.card,
      "wallet-text": t.wallet,

      // Fare estimate
      "distance-label": t.estimated_distance,
      "time-label": t.estimated_time,
      "total-label": t.total_cost,

      // Services section
      "services-title": t.our_services,
      "services-subtitle": t.services_subtitle,
      "daily-rides-title": t.daily_rides,
      "daily-rides-desc": t.daily_rides_desc,
      "airport-title": t.airport_transfer,
      "airport-desc": t.airport_transfer_desc,
      "delivery-title": t.delivery_service,
      "delivery-desc": t.delivery_service_desc,
      "group-title": t.group_rides,
      "group-desc": t.group_rides_desc,

      // Features
      "features-title": t.why_choose_us,
      "safety-title": t.safety_reliability,
      "safety-desc": t.safety_desc,
      "speed-title": t.quick_arrival_feature,
      "speed-desc": t.quick_arrival_desc,
      "pricing-title": t.transparent_pricing,
      "pricing-desc": t.transparent_pricing_desc,
      "rating-title": t.driver_rating,
      "rating-desc": t.driver_rating_desc,

      // CTA
      "cta-title": t.start_journey,
      "cta-description": t.cta_description,
      "cta-book-text": t.book_ride_cta,
      "cta-driver-text": t.join_driver,

      // Footer
      "footer-description": t.footer_description,
      "company-title": t.company,
      "about-link": t.about_us,
      "careers-link": t.careers,
      "news-link": t.news,
      "investors-link": t.investors,
      "support-title": t.support,
      "help-link": t.help_center,
      "contact-link": t.contact_us,
      "terms-link": t.terms,
      "privacy-link": t.privacy,
      "rights-text": t.all_rights_reserved,
      "cookies-link": t.cookies,

      // Modals
      "login-title": t.login_title,
      "register-title": t.register_title,
      "full-name-label": t.full_name,
      "email-label": t.email,
      "mobile-label": t.mobile,
      "password-label": t.password,
      "forgot-link": t.forgot_password,
    }

    Object.entries(elementsToUpdate).forEach(([id, text]) => {
      const element = document.getElementById(id)
      if (element && text) {
        element.textContent = text
      }
    })

    // Update input placeholders
    const inputPlaceholders = {
      "pickup-input": this.getPickupPlaceholder(),
      "dropoff-input": this.getDropoffPlaceholder(),
      "login-email": t.email,
      "login-password": t.password,
      "register-name": t.full_name,
      "register-email": t.email,
      "register-phone": t.mobile,
      "register-password": t.password,
    }

    Object.entries(inputPlaceholders).forEach(([id, placeholder]) => {
      const element = document.getElementById(id)
      if (element && placeholder) {
        element.placeholder = placeholder
      }
    })
  }

  getPickupPlaceholder() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab || "ride"
    return activeTab === "delivery" ? t.pickup_delivery : t.pickup_from
  }

  getDropoffPlaceholder() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab || "ride"
    return activeTab === "delivery" ? t.dropoff_delivery : t.dropoff_to
  }

  updateCurrency() {
    // Update all currency displays
    const currencyElements = document.querySelectorAll(".currency-symbol")
    currencyElements.forEach((element) => {
      element.textContent = this.currentCurrency.symbol
    })

    // Update ride type prices with new currency
    this.updateRideTypePrices()
  }

  updateRideTypePrices() {
    const baseRates = this.getBaseRates()

    Object.keys(baseRates).forEach((type) => {
      const typeElement = document.querySelector(`[data-type="${type}"]`)
      if (typeElement) {
        const priceElement = typeElement.querySelector(".ride-price")
        if (priceElement) {
          priceElement.textContent = this.formatCurrency(baseRates[type].base)
        }
      }
    })
  }

  getBaseRates() {
    // Base rates in USD, convert to local currency
    const usdRates = {
      economy: { base: 4, perKm: 0.67 },
      comfort: { base: 6.7, perKm: 0.93 },
      premium: { base: 10.7, perKm: 1.33 },
    }

    // Currency conversion rates (simplified - in production, use real-time rates)
    const conversionRates = {
      USD: 1,
      SAR: 3.75,
      PKR: 280,
      INR: 83,
      CNY: 7.2,
      EUR: 0.85,
      BRL: 5.0,
    }

    const rate = conversionRates[this.currentCurrency.code] || 1

    const convertedRates = {}
    Object.keys(usdRates).forEach((type) => {
      convertedRates[type] = {
        base: usdRates[type].base * rate,
        perKm: usdRates[type].perKm * rate,
      }
    })

    return convertedRates
  }

  setDirection() {
    const isRTL = rtlLanguages.includes(this.currentLanguage)
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = this.currentLanguage
  }

  formatCurrency(amount) {
    const formattedAmount = Math.round(amount).toLocaleString()
    return `${this.currentCurrency.symbol}${formattedAmount}`
  }

  initializeAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
        }
      })
    }, observerOptions)

    // Observe elements for animation
    document.querySelectorAll(".service-card, .feature-item, .stat-card").forEach((el) => {
      observer.observe(el)
    })
  }

  toggleMobileMenu() {
    const nav = document.querySelector(".nav")
    nav.classList.toggle("mobile-active")
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("active")
      document.body.style.overflow = "hidden"
    }
  }

  hideAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active")
    })
    document.body.style.overflow = ""
  }

  switchTab(tabType) {
    // Update active tab
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabType}"]`).classList.add("active")

    // Update placeholders based on tab and language
    document.getElementById("pickup-input").placeholder = this.getPickupPlaceholder()
    document.getElementById("dropoff-input").placeholder = this.getDropoffPlaceholder()
  }

  async handlePickupInput(e) {
    const query = e.target.value.trim()
    if (query.length < 3) return

    try {
      const suggestions = await this.geocodeAddress(query)
      this.showLocationSuggestions(suggestions, "pickup")
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  async handleDropoffInput(e) {
    const query = e.target.value.trim()
    if (query.length < 3) return

    try {
      const suggestions = await this.geocodeAddress(query)
      this.showLocationSuggestions(suggestions, "dropoff")
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  async geocodeAddress(address) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&accept-language=${this.currentLanguage}`,
    )
    const data = await response.json()

    return data.map((item) => ({
      display_name: item.display_name,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
    }))
  }

  showLocationSuggestions(suggestions, type) {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector(".location-suggestions")
    if (existingSuggestions) {
      existingSuggestions.remove()
    }

    if (suggestions.length === 0) return

    const input = document.getElementById(`${type}-input`)
    const suggestionsContainer = document.createElement("div")
    suggestionsContainer.className = "location-suggestions"

    suggestionsContainer.innerHTML = suggestions
      .map(
        (suggestion) => `
            <div class="suggestion-item" data-lat="${suggestion.lat}" data-lng="${suggestion.lng}">
                <i class="fas fa-map-marker-alt"></i>
                <span>${suggestion.display_name}</span>
            </div>
        `,
      )
      .join("")

    // Position suggestions
    const inputRect = input.getBoundingClientRect()
    suggestionsContainer.style.position = "absolute"
    suggestionsContainer.style.top = `${inputRect.bottom + window.scrollY}px`
    suggestionsContainer.style.left = `${inputRect.left + window.scrollX}px`
    suggestionsContainer.style.width = `${inputRect.width}px`
    suggestionsContainer.style.zIndex = "1000"
    suggestionsContainer.style.transform = "translateX(0)"
    suggestionsContainer.style.transition = "transform 0.3s ease"

    document.body.appendChild(suggestionsContainer)

    // Handle suggestion clicks
    suggestionsContainer.addEventListener("click", (e) => {
      const suggestionItem = e.target.closest(".suggestion-item")
      if (suggestionItem) {
        const lat = Number.parseFloat(suggestionItem.dataset.lat)
        const lng = Number.parseFloat(suggestionItem.dataset.lng)
        const address = suggestionItem.querySelector("span").textContent

        input.value = address

        if (type === "pickup") {
          this.pickupLocation = { lat, lng, address }
        } else {
          this.dropoffLocation = { lat, lng, address }
        }

        suggestionsContainer.remove()
        this.calculateFare()
      }
    })

    // Remove suggestions when clicking outside
    setTimeout(() => {
      document.addEventListener(
        "click",
        (e) => {
          if (!suggestionsContainer.contains(e.target) && e.target !== input) {
            suggestionsContainer.remove()
          }
        },
        { once: true },
      )
    }, 100)
  }

  getCurrentLocation() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const btn = document.getElementById("current-location-btn")
    const originalHTML = btn.innerHTML

    btn.innerHTML = '<div class="loading"></div>'
    btn.disabled = true

    if (!navigator.geolocation) {
      this.showNotification(t.geolocation_not_supported, "error")
      btn.innerHTML = originalHTML
      btn.disabled = false
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${this.currentLanguage}`,
          )
          const data = await response.json()

          if (data && data.display_name) {
            document.getElementById("pickup-input").value = data.display_name
            this.pickupLocation = { lat, lng, address: data.display_name }
            this.calculateFare()
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error)
        }

        btn.innerHTML = originalHTML
        btn.disabled = false
      },
      (error) => {
        this.showNotification(t.location_error, "error")
        btn.innerHTML = originalHTML
        btn.disabled = false
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  swapLocations() {
    const pickupInput = document.getElementById("pickup-input")
    const dropoffInput = document.getElementById("dropoff-input")

    const tempValue = pickupInput.value
    pickupInput.value = dropoffInput.value
    dropoffInput.value = tempValue

    const tempLocation = this.pickupLocation
    this.pickupLocation = this.dropoffLocation
    this.dropoffLocation = tempLocation

    this.calculateFare()
  }

  selectRideType(type) {
    document.querySelectorAll(".ride-type").forEach((el) => {
      el.classList.remove("active")
    })
    document.querySelector(`[data-type="${type}"]`).classList.add("active")

    this.selectedRideType = type
    this.calculateFare()
  }

  selectPaymentMethod(method) {
    document.querySelectorAll(".payment-method").forEach((el) => {
      el.classList.remove("active")
    })
    document.querySelector(`[data-method="${method}"]`).classList.add("active")

    this.selectedPaymentMethod = method
  }

  calculateFare() {
    if (!this.pickupLocation || !this.dropoffLocation) return

    const t = translations[this.currentLanguage] || translations["ar"]
    const distance = this.calculateDistance(
      this.pickupLocation.lat,
      this.pickupLocation.lng,
      this.dropoffLocation.lat,
      this.dropoffLocation.lng,
    )

    const baseRates = this.getBaseRates()
    const rate = baseRates[this.selectedRideType]
    const estimatedFare = rate.base + distance * rate.perKm
    const estimatedTime = Math.ceil(distance * 2) // Rough estimate: 2 minutes per km

    // Update UI
    document.getElementById("distance-estimate").textContent = `${distance.toFixed(1)} ${t.km}`
    document.getElementById("time-estimate").textContent = `${estimatedTime} ${t.minute}`
    document.getElementById("total-estimate").textContent = this.formatCurrency(estimatedFare)

    // Update ride type prices
    Object.keys(baseRates).forEach((type) => {
      const typeElement = document.querySelector(`[data-type="${type}"]`)
      if (typeElement) {
        const price = baseRates[type].base + distance * baseRates[type].perKm
        typeElement.querySelector(".ride-price").textContent = this.formatCurrency(price)
      }
    })

    document.getElementById("fare-estimate").style.display = "block"
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  toRad(deg) {
    return deg * (Math.PI / 180)
  }

  async handleBooking(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    if (!this.currentUser) {
      this.showModal("login-modal")
      return
    }

    if (!this.pickupLocation || !this.dropoffLocation) {
      this.showNotification(t.location_required, "error")
      return
    }

    const bookBtn = document.getElementById("book-ride-btn")
    const originalHTML = bookBtn.innerHTML

    bookBtn.innerHTML = '<div class="loading"></div> ' + (t.booking || "جاري الحجز...")
    bookBtn.disabled = true

    try {
      const bookingData = {
        pickup_address: this.pickupLocation.address,
        pickup_lat: this.pickupLocation.lat,
        pickup_lng: this.pickupLocation.lng,
        dropoff_address: this.dropoffLocation.address,
        dropoff_lat: this.dropoffLocation.lat,
        dropoff_lng: this.dropoffLocation.lng,
        ride_type: this.selectedRideType,
        payment_method: this.selectedPaymentMethod,
        currency: this.currentCurrency.code,
      }

      const response = await fetch("api.php?action=request_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      const result = await response.json()

      if (result.success) {
        this.currentRide = result.data
        this.showNotification(t.booking_success, "success")
        this.showRideStatus(result.data.ride_id)
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification(t.booking_failed, "error")
    } finally {
      bookBtn.innerHTML = originalHTML
      bookBtn.disabled = false
    }
  }

  async handleLogin(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    try {
      const response = await fetch("api.php?action=login_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        this.currentUser = result.data
        this.updateAuthUI()
        this.hideAllModals()
        this.showNotification(t.login_success, "success")
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to login", "error")
    }
  }

  async handleRegister(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const formData = {
      full_name: document.getElementById("register-name").value,
      email: document.getElementById("register-email").value,
      mobile: document.getElementById("register-phone").value,
      password: document.getElementById("register-password").value,
      preferred_language: this.currentLanguage,
    }

    try {
      const response = await fetch("api.php?action=register_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        this.currentUser = result.data
        this.updateAuthUI()
        this.hideAllModals()
        this.showNotification(t.register_success, "success")
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to create account", "error")
    }
  }

  showRideStatus(rideId) {
    this.showModal("ride-status-modal")
    this.updateRideStatus(rideId)

    // Start polling for ride status updates
    this.rideStatusInterval = setInterval(() => {
      this.updateRideStatus(rideId)
    }, 5000)
  }

  async updateRideStatus(rideId) {
    try {
      const response = await fetch(`api.php?action=get_ride_status&ride_id=${rideId}`)
      const result = await response.json()

      if (result.success) {
        this.renderRideStatus(result.data)

        if (result.data.ride_status === "completed" || result.data.ride_status === "cancelled") {
          clearInterval(this.rideStatusInterval)
        }
      }
    } catch (error) {
      console.error("Failed to get ride status:", error)
    }
  }

  renderRideStatus(ride) {
    const t = translations[this.currentLanguage] || translations["ar"]
    const statusText = document.getElementById("ride-status-text")
    const statusBody = document.getElementById("ride-status-body")

    const statusMessages = {
      requested: t.searching_driver,
      accepted: t.driver_found,
      driver_arrived: t.driver_arrived,
      in_progress: t.ride_in_progress,
      completed: t.ride_completed,
      cancelled: t.ride_cancelled,
    }

    statusText.textContent = statusMessages[ride.ride_status] || ride.ride_status

    let bodyHTML = `
            <div class="ride-details">
                <div class="detail-row">
                    <span class="detail-label">${t.from}</span>
                    <span class="detail-value">${ride.pickup_address}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">${t.to}</span>
                    <span class="detail-value">${ride.dropoff_address}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">${t.estimated_fare}</span>
                    <span class="detail-value">${this.formatCurrency(ride.estimated_fare)}</span>
                </div>
            </div>
        `

    if (ride.driver_name) {
      bodyHTML += `
                <div class="driver-info">
                    <h4>${t.driver_info}</h4>
                    <div class="driver-details">
                        <div class="driver-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="driver-text">
                            <div class="driver-name">${ride.driver_name}</div>
                            <div class="driver-vehicle">${ride.vehicle_color} ${ride.vehicle_model}</div>
                            <div class="driver-plate">${ride.license_plate}</div>
                            <div class="driver-rating">
                                <i class="fas fa-star"></i>
                                <span>${ride.driver_rating}</span>
                            </div>
                        </div>
                        <div class="driver-actions">
                            <a href="tel:${ride.driver_mobile}" class="btn btn-primary btn-small">
                                <i class="fas fa-phone"></i>
                                ${t.call}
                            </a>
                        </div>
                    </div>
                </div>
            `
    }

    statusBody.innerHTML = bodyHTML
  }

  updateAuthUI() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const authButtons = document.querySelector(".auth-buttons")
    if (this.currentUser) {
      authButtons.innerHTML = `
                <span class="user-name">${t.welcome} ${this.currentUser.full_name}</span>
                <button id="logout-btn" class="btn btn-ghost">${t.logout || "Logout"}</button>
            `

      document.getElementById("logout-btn").addEventListener("click", this.handleLogout.bind(this))
    }
  }

  async handleLogout() {
    const t = translations[this.currentLanguage] || translations["ar"]
    try {
      await fetch("api.php?action=logout", { method: "POST" })
      this.currentUser = null

      const authButtons = document.querySelector(".auth-buttons")
      authButtons.innerHTML = `
                <button id="login-btn" class="btn btn-ghost">${t.login}</button>
                <button id="register-btn" class="btn btn-primary">${t.register}</button>
            `

      // Re-bind auth button events
      document.getElementById("login-btn").addEventListener("click", () => this.showModal("login-modal"))
      document.getElementById("register-btn").addEventListener("click", () => this.showModal("register-modal"))

      this.showNotification(t.logout_success, "success")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
                <span>${message}</span>
            </div>
        `

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      background: type === "success" ? "var(--accent-color)" : "#ff6b6b",
      color: "white",
      padding: "1rem 1.5rem",
      borderRadius: "var(--border-radius)",
      boxShadow: "var(--shadow-medium)",
      zIndex: "3000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
      maxWidth: "400px",
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 4000)
  }

  checkAuthStatus() {
    // Check if user is already logged in
    // This would typically check session or token
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new UberTaxiApp()
})
