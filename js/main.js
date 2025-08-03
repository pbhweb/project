// TaxiHub Main Application
const currencies = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.85 },
  GBP: { symbol: "£", rate: 0.75 },
  // Add other currencies as needed
}

const languageCurrencyMap = {
  ar: "SAR",
  en: "USD",
  ur: "PKR",
  hi: "INR",
  zh: "CNY",
  fr: "EUR",
  es: "EUR",
  pt: "BRL",
  tr: "TRY",
  fa: "IRR",
  // Add other language-currency mappings as needed
}

const translations = {
  ar: {
    welcome: "مرحباً",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    searching_driver: "جاري البحث عن سائق...",
    driver_found: "تم العثور على سائق!",
    driver_arrived: "وصل السائق",
    ride_in_progress: "جاري الرحلة",
    ride_completed: "انتهت الرحلة",
    ride_cancelled: "تم إلغاء الرحلة",
    from: "من",
    to: "إلى",
    estimated_fare: "السعر المقدر",
    km: "كم",
    minute: "دقيقة",
    location_required: "يرجى تحديد نقطة البداية والوجهة",
    booking_success: "تم حجز الرحلة بنجاح!",
    booking_failed: "فشل حجز الرحلة",
    login_success: "تم تسجيل الدخول بنجاح!",
    register_success: "تم إنشاء الحساب بنجاح!",
    logout_success: "تم تسجيل الخروج بنجاح",
    geolocation_not_supported: "لا يدعم متصفحك تحديد الموقع",
    location_error: "لا يمكن الحصول على موقعك",
  },
  en: {
    welcome: "Welcome",
    login: "Login",
    register: "Register",
    logout: "Logout",
    searching_driver: "Searching for driver...",
    driver_found: "Driver found!",
    driver_arrived: "Driver arrived",
    ride_in_progress: "Ride in progress",
    ride_completed: "Ride completed",
    ride_cancelled: "Ride cancelled",
    from: "From",
    to: "To",
    estimated_fare: "Estimated fare",
    km: "km",
    minute: "minute",
    location_required: "Please specify pickup and destination",
    booking_success: "Ride booked successfully!",
    booking_failed: "Failed to book ride",
    login_success: "Login successful!",
    register_success: "Account created successfully!",
    logout_success: "Logout successful",
    geolocation_not_supported: "Geolocation not supported",
    location_error: "Unable to get location",
  },
  // Add other languages as needed
}

const rtlLanguages = ["ar", "ur", "fa"]

class TaxiHubApp {
  constructor() {
    this.currentUser = null
    this.currentRide = null
    this.pickupLocation = null
    this.dropoffLocation = null
    this.selectedRideType = "economy"
    this.selectedPaymentMethod = "cash"
    this.rideStatusInterval = null
    this.currentLanguage = localStorage.getItem("preferred_language") || "ar"
    this.currentCurrency = localStorage.getItem("preferred_currency") || this.getLanguageCurrency(this.currentLanguage)
    this.supportedCurrencies = {}
    this.supportedLanguages = {}

    this.init()
  }

  async init() {
    this.showLoading()
    try {
      await this.loadCurrencies()
      await this.loadLanguages()
      this.bindEvents()
      this.initializeAnimations()
      this.checkAuthStatus()
      this.updateLanguage()
      this.updateCurrency()
      this.setDirection()
      this.populateSelectors()
    } catch (error) {
      console.error("Initialization error:", error)
      this.showNotification("Failed to initialize application", "error")
    } finally {
      this.hideLoading()
    }
  }

  async loadCurrencies() {
    try {
      const response = await fetch("api.php?action=get_currencies")
      const result = await response.json()
      if (result.success) {
        this.supportedCurrencies = result.data
      }
    } catch (error) {
      console.error("Failed to load currencies:", error)
      // Fallback to local currencies
      this.supportedCurrencies = currencies
    }
  }

  async loadLanguages() {
    try {
      const response = await fetch("api.php?action=get_languages")
      const result = await response.json()
      if (result.success) {
        this.supportedLanguages = result.data
      }
    } catch (error) {
      console.error("Failed to load languages:", error)
      // Fallback to local languages
      this.supportedLanguages = {
        ar: "العربية",
        en: "English",
        ur: "اردو",
        hi: "हिन्दी",
        zh: "中文",
        fr: "Français",
        es: "Español",
        pt: "Português",
        tr: "Türkçe",
        fa: "فارسی",
      }
    }
  }

  populateSelectors() {
    const languageSelector = document.getElementById("language-selector")
    const currencySelector = document.getElementById("currency-selector")

    if (languageSelector) {
      languageSelector.innerHTML = ""
      Object.entries(this.supportedLanguages).forEach(([code, name]) => {
        const option = document.createElement("option")
        option.value = code
        option.textContent = name
        if (code === this.currentLanguage) {
          option.selected = true
        }
        languageSelector.appendChild(option)
      })
    }

    if (currencySelector) {
      currencySelector.innerHTML = ""
      Object.entries(this.supportedCurrencies).forEach(([code, info]) => {
        const option = document.createElement("option")
        option.value = code
        option.textContent = `${info.symbol} ${code}`
        if (code === this.currentCurrency) {
          option.selected = true
        }
        currencySelector.appendChild(option)
      })
    }
  }

  bindEvents() {
    // Mobile menu toggle
    const mobileToggle = document.querySelector(".mobile-menu-toggle")
    if (mobileToggle) {
      mobileToggle.addEventListener("click", this.toggleMobileMenu.bind(this))
    }

    // Language and currency selectors
    const languageSelector = document.getElementById("language-selector")
    const currencySelector = document.getElementById("currency-selector")

    if (languageSelector) {
      languageSelector.addEventListener("change", (e) => {
        this.setLanguage(e.target.value)
      })
    }

    if (currencySelector) {
      currencySelector.addEventListener("change", (e) => {
        this.setCurrency(e.target.value)
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
        this.switchTab(e.target.closest(".tab-btn").dataset.tab)
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
        setTimeout(() => {
          document.getElementById("pickup-input")?.focus()
        }, 500)
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

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideAllModals()
      }
    })
  }

  setLanguage(language) {
    this.currentLanguage = language
    localStorage.setItem("preferred_language", language)

    // Auto-update currency based on language if not manually set
    if (!localStorage.getItem("currency_manually_set")) {
      this.currentCurrency = this.getLanguageCurrency(language)
      localStorage.setItem("preferred_currency", this.currentCurrency)
    }

    this.updateLanguage()
    this.updateCurrency()
    this.setDirection()
    this.populateSelectors()
    this.calculateFare() // Recalculate with new currency
  }

  setCurrency(currency) {
    this.currentCurrency = currency
    localStorage.setItem("preferred_currency", currency)
    localStorage.setItem("currency_manually_set", "true")

    this.updateCurrency()
    this.calculateFare() // Recalculate with new currency
  }

  getLanguageCurrency(language) {
    return languageCurrencyMap[language] || "USD"
  }

  updateLanguage() {
    const t = translations[this.currentLanguage] || translations["ar"]

    // Update all elements with data-translate attribute
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate")
      if (t[key]) {
        if (element.tagName === "INPUT" && element.type !== "submit") {
          element.placeholder = t[key]
        } else {
          element.textContent = t[key]
        }
      }
    })

    // Update input placeholders based on active tab
    this.updateInputPlaceholders()
  }

  updateInputPlaceholders() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab || "ride"

    const pickupInput = document.getElementById("pickup-input")
    const dropoffInput = document.getElementById("dropoff-input")

    if (pickupInput) {
      pickupInput.placeholder = activeTab === "delivery" ? t.pickup_delivery || t.pickup_from : t.pickup_from
    }

    if (dropoffInput) {
      dropoffInput.placeholder = activeTab === "delivery" ? t.dropoff_delivery || t.dropoff_to : t.dropoff_to
    }
  }

  updateCurrency() {
    const currencyInfo = this.supportedCurrencies[this.currentCurrency] || this.supportedCurrencies["USD"]

    // Update all currency symbols
    document.querySelectorAll(".currency-symbol").forEach((element) => {
      element.textContent = currencyInfo.symbol
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
          const price = baseRates[type].base
          const currencySymbol = this.supportedCurrencies[this.currentCurrency]?.symbol || "$"
          priceElement.innerHTML = `${Math.round(price)} <span class="currency-symbol">${currencySymbol}</span>`
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

    const rate = this.supportedCurrencies[this.currentCurrency]?.rate || 1

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
    const currencyInfo = this.supportedCurrencies[this.currentCurrency] || this.supportedCurrencies["USD"]
    const formattedAmount = Math.round(amount).toLocaleString()
    return `${currencyInfo.symbol}${formattedAmount}`
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
    document.querySelectorAll(".service-card, .feature-item").forEach((el) => {
      observer.observe(el)
    })
  }

  toggleMobileMenu() {
    const nav = document.querySelector(".nav")
    nav?.classList.toggle("mobile-active")
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
    document.querySelector(`[data-tab="${tabType}"]`)?.classList.add("active")

    // Update placeholders based on tab and language
    this.updateInputPlaceholders()
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

    btn.innerHTML = '<div class="spinner"></div>'
    btn.disabled = true

    if (!navigator.geolocation) {
      this.showNotification(t.geolocation_not_supported || "Geolocation not supported", "error")
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
        this.showNotification(t.location_error || "Unable to get location", "error")
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
    document.querySelector(`[data-type="${type}"]`)?.classList.add("active")

    this.selectedRideType = type
    this.calculateFare()
  }

  selectPaymentMethod(method) {
    document.querySelectorAll(".payment-method").forEach((el) => {
      el.classList.remove("active")
    })
    document.querySelector(`[data-method="${method}"]`)?.classList.add("active")

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
    document.getElementById("distance-estimate").textContent = `${distance.toFixed(1)} ${t.km || "km"}`
    document.getElementById("time-estimate").textContent = `${estimatedTime} ${t.minute || "minute"}`
    document.getElementById("total-estimate").innerHTML = `${this.formatCurrency(estimatedFare)}`

    // Update ride type prices
    Object.keys(baseRates).forEach((type) => {
      const typeElement = document.querySelector(`[data-type="${type}"]`)
      if (typeElement) {
        const price = baseRates[type].base + distance * baseRates[type].perKm
        const priceElement = typeElement.querySelector(".ride-price")
        if (priceElement) {
          const currencySymbol = this.supportedCurrencies[this.currentCurrency]?.symbol || "$"
          priceElement.innerHTML = `${Math.round(price)} <span class="currency-symbol">${currencySymbol}</span>`
        }
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
      this.showNotification(t.location_required || "Please specify pickup and destination", "error")
      return
    }

    const bookBtn = document.getElementById("book-ride-btn")
    const originalHTML = bookBtn.innerHTML

    bookBtn.innerHTML = '<div class="spinner"></div> ' + (t.loading || "Loading...")
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
        currency: this.currentCurrency,
      }

      const response = await fetch("api.php?action=request_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      const result = await response.json()

      if (result.success) {
        this.currentRide = result.data
        this.showNotification(t.booking_success || "Ride booked successfully!", "success")
        this.showRideStatus(result.data.ride_id)
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification(t.booking_failed || "Failed to book ride", "error")
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
        this.showNotification(t.login_success || "Login successful!", "success")
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
      preferred_currency: this.currentCurrency,
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
        this.showNotification(t.register_success || "Account created successfully!", "success")
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

        if (result.data.status === "completed" || result.data.status === "cancelled") {
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
      pending: t.searching_driver || "Searching for driver...",
      accepted: t.driver_found || "Driver found!",
      driver_arrived: t.driver_arrived || "Driver arrived",
      in_progress: t.ride_in_progress || "Ride in progress",
      completed: t.ride_completed || "Ride completed",
      cancelled: t.ride_cancelled || "Ride cancelled",
    }

    if (statusText) {
      statusText.textContent = statusMessages[ride.status] || ride.status
    }

    let bodyHTML = `
      <div class="ride-details">
          <div class="detail-row">
              <span class="detail-label">${t.from || "From"}:</span>
              <span class="detail-value">${ride.pickup_address}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label">${t.to || "To"}:</span>
              <span class="detail-value">${ride.dropoff_address}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label">${t.estimated_fare || "Estimated fare"}:</span>
              <span class="detail-value">${this.formatCurrency(ride.estimated_fare)}</span>
          </div>
      </div>
    `

    if (ride.driver_name) {
      bodyHTML += `
        <div class="driver-info">
            <h4>${t.driver_info || "Driver Information"}</h4>
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
                        ${t.call || "Call"}
                    </a>
                </div>
            </div>
        </div>
      `
    }

    if (statusBody) {
      statusBody.innerHTML = bodyHTML
    }
  }

  updateAuthUI() {
    const t = translations[this.currentLanguage] || translations["ar"]
    const authButtons = document.querySelector(".auth-buttons")
    if (this.currentUser && authButtons) {
      authButtons.innerHTML = `
        <span class="user-name">${t.welcome || "Welcome"} ${this.currentUser.full_name}</span>
        <button id="logout-btn" class="btn btn-ghost">${t.logout || "Logout"}</button>
      `

      document.getElementById("logout-btn")?.addEventListener("click", this.handleLogout.bind(this))
    }
  }

  async handleLogout() {
    const t = translations[this.currentLanguage] || translations["ar"]
    try {
      await fetch("api.php?action=logout", { method: "POST" })
      this.currentUser = null

      const authButtons = document.querySelector(".auth-buttons")
      if (authButtons) {
        authButtons.innerHTML = `
          <button id="login-btn" class="btn btn-ghost">${t.login || "Login"}</button>
          <button id="register-btn" class="btn btn-primary">${t.register || "Register"}</button>
        `

        // Re-bind auth button events
        document.getElementById("login-btn")?.addEventListener("click", () => this.showModal("login-modal"))
        document.getElementById("register-btn")?.addEventListener("click", () => this.showModal("register-modal"))
      }

      this.showNotification(t.logout_success || "Logout successful", "success")
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

  showLoading() {
    const loadingOverlay = document.getElementById("loading-overlay")
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex"
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById("loading-overlay")
    if (loadingOverlay) {
      loadingOverlay.style.display = "none"
    }
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
  new TaxiHubApp()
})

// Add CSS for additional styles
const additionalStyles = document.createElement("style")
additionalStyles.textContent = `
  .ride-details {
      margin-bottom: 1.5rem;
  }
  
  .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
  }
  
  .detail-row:last-child {
      border-bottom: none;
  }
  
  .detail-label {
      color: var(--text-secondary);
      font-weight: 500;
  }
  
  .detail-value {
      color: var(--text-primary);
      font-weight: 600;
  }
  
  .driver-info {
      background: var(--background-secondary);
      border-radius: var(--border-radius);
      padding: 1rem;
  }
  
  .driver-info h4 {
      color: var(--text-primary);
      margin-bottom: 1rem;
      font-size: 1.1rem;
  }
  
  .driver-details {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  
  .driver-avatar {
      width: 50px;
      height: 50px;
      background: var(--accent-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
  }
  
  .driver-text {
      flex: 1;
  }
  
  .driver-name {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
  }
  
  .driver-vehicle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
  }
  
  .driver-plate {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
  }
  
  .driver-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--accent-color);
      font-size: 0.9rem;
  }
  
  .driver-rating i {
      color: #ffd700;
  }
  
  .user-name {
      color: var(--text-primary);
      font-weight: 500;
  }
  
  .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
  }
  
  .animate-in {
      animation: slideInUp 0.6s ease-out;
  }
  
  @keyframes slideInUp {
      from {
          opacity: 0;
          transform: translateY(30px);
      }
      to {
          opacity: 1;
          transform: translateY(0);
      }
  }
  
  .nav.mobile-active {
      display: flex;
      position: fixed;
      top: 80px;
      left: 0;
      right: 0;
      background: var(--background-card);
      flex-direction: column;
      padding: 2rem;
      border-bottom: 1px solid var(--border-color);
  }
  
  .nav.mobile-active .nav-links,
  .nav.mobile-active .nav-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
  }
  
  .nav.mobile-active .language-currency-selector {
      flex-direction: column;
      gap: 0.5rem;
  }
`

document.head.appendChild(additionalStyles)
