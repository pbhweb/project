// Driver Dashboard Application
const translations = {
  ar: {
    login_success: "تسجيل الدخول ناجح!",
    register_success: "تم إنشاء الحساب بنجاح!",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    logout_success: "تسجيل الخروج ناجح",
    online: "متصل",
    available: "متوفر",
    offline: "غير متصل",
    no_rides_available: "لا توجد رحلات متاحة",
    km: "كم",
    accept_ride: "قبول الرحلة",
    user: "المستخدم",
    phone: "الهاتف",
    from: "من",
    to: "إلى",
    fare: "الرسوم",
    confirm_cancel: "هل أنت متأكد من إلغاء هذه الرحلة؟",
    ride_accepted: "تم قبول الرحلة!",
    status_updated: "تم تحديث الحالة!",
    ride_completed: "تم إتمام الرحلة!",
    ride_cancelled: "تم إلغاء الرحلة",
    earnings_today: "الإيرادات اليومية",
    earnings_week: "الإيرادات الأسبوعية",
    earnings_month: "الإيرادات الشهرية",
  },
  en: {
    login_success: "Login successful!",
    register_success: "Account created successfully!",
    welcome: "Welcome",
    logout: "Logout",
    logout_success: "Logout successful",
    online: "Online",
    available: "Available",
    offline: "Offline",
    no_rides_available: "No rides available",
    km: "km",
    accept_ride: "Accept Ride",
    user: "User",
    phone: "Phone",
    from: "From",
    to: "To",
    fare: "Fare",
    confirm_cancel: "Are you sure you want to cancel this ride?",
    ride_accepted: "Ride accepted!",
    status_updated: "Status updated!",
    ride_completed: "Ride completed!",
    ride_cancelled: "Ride cancelled",
    earnings_today: "Earnings Today",
    earnings_week: "Earnings This Week",
    earnings_month: "Earnings This Month",
  },
}

class DriverApp {
  constructor() {
    this.currentDriver = null
    this.currentRide = null
    this.isOnline = false
    this.onlineStartTime = null
    this.ridesPollingInterval = null
    this.locationUpdateInterval = null
    this.currentLanguage = localStorage.getItem("preferred_language") || "ar"
    this.currentCurrency = localStorage.getItem("preferred_currency") || "SAR"
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
      this.updateLanguage()
      this.updateCurrency()
      this.setDirection()
      this.populateSelectors()
      this.checkAuthStatus()
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
      this.supportedCurrencies = {
        SAR: { symbol: "ر.س", rate: 3.75 },
        USD: { symbol: "$", rate: 1 },
        EUR: { symbol: "€", rate: 0.85 },
      }
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
      this.supportedLanguages = {
        ar: "العربية",
        en: "English",
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

    // Driver status toggle
    const statusToggle = document.getElementById("driver-status-toggle")
    if (statusToggle) {
      statusToggle.addEventListener("change", this.toggleDriverStatus.bind(this))
    }

    // Auth tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchAuthTab(e.target.dataset.tab)
      })
    })

    // Auth forms
    const loginForm = document.getElementById("driver-login-form")
    const registerForm = document.getElementById("driver-register-form")

    if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this))
    if (registerForm) registerForm.addEventListener("submit", this.handleRegister.bind(this))

    // Refresh rides button
    const refreshRidesBtn = document.getElementById("refresh-rides-btn")
    if (refreshRidesBtn) {
      refreshRidesBtn.addEventListener("click", this.loadAvailableRides.bind(this))
    }

    // Ride action buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches(".accept-ride-btn")) {
        const rideId = e.target.dataset.rideId
        this.acceptRide(rideId)
      }

      if (e.target.matches("#arrived-btn")) {
        this.updateRideStatus("driver_arrived")
      }

      if (e.target.matches("#start-ride-btn")) {
        this.updateRideStatus("in_progress")
      }

      if (e.target.matches("#complete-ride-btn")) {
        this.completeRide()
      }

      if (e.target.matches("#cancel-ride-btn")) {
        this.cancelRide()
      }
    })

    // Modal events
    document.querySelectorAll(".modal-close, .modal-overlay").forEach((element) => {
      element.addEventListener("click", (e) => {
        if (e.target === element) {
          this.hideAllModals()
        }
      })
    })
  }

  setLanguage(language) {
    this.currentLanguage = language
    localStorage.setItem("preferred_language", language)
    this.updateLanguage()
    this.setDirection()
  }

  setCurrency(currency) {
    this.currentCurrency = currency
    localStorage.setItem("preferred_currency", currency)
    this.updateCurrency()
  }

  updateLanguage() {
    const t = translations[this.currentLanguage] || translations["ar"]

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

    document.querySelectorAll("[data-translate-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-translate-placeholder")
      if (t[key]) {
        element.placeholder = t[key]
      }
    })
  }

  updateCurrency() {
    const currencyInfo = this.supportedCurrencies[this.currentCurrency] || this.supportedCurrencies["SAR"]

    document.querySelectorAll(".currency-symbol").forEach((element) => {
      element.textContent = currencyInfo.symbol
    })
  }

  setDirection() {
    const rtlLanguages = ["ar", "ur", "fa"]
    const isRTL = rtlLanguages.includes(this.currentLanguage)
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = this.currentLanguage
  }

  switchAuthTab(tab) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active")

    const loginForm = document.getElementById("driver-login-form")
    const registerForm = document.getElementById("driver-register-form")

    if (tab === "login") {
      loginForm.style.display = "block"
      registerForm.style.display = "none"
    } else {
      loginForm.style.display = "none"
      registerForm.style.display = "block"
    }
  }

  async handleLogin(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const email = document.getElementById("driver-login-email").value
    const password = document.getElementById("driver-login-password").value

    try {
      const response = await fetch("api.php?action=login_driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        this.currentDriver = result.data
        this.showDriverDashboard()
        this.showNotification(t.login_success || "Login successful!", "success")
        this.loadDriverStats()
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
      full_name: document.getElementById("driver-register-name").value,
      email: document.getElementById("driver-register-email").value,
      mobile: document.getElementById("driver-register-phone").value,
      password: document.getElementById("driver-register-password").value,
      license_number: document.getElementById("driver-license").value,
      vehicle_model: document.getElementById("vehicle-model").value,
      vehicle_color: document.getElementById("vehicle-color").value,
      license_plate: document.getElementById("license-plate").value,
      preferred_language: this.currentLanguage,
      preferred_currency: this.currentCurrency,
    }

    try {
      const response = await fetch("api.php?action=register_driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        this.currentDriver = result.data
        this.showDriverDashboard()
        this.showNotification(t.register_success || "Account created successfully!", "success")
        this.loadDriverStats()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to create account", "error")
    }
  }

  showDriverDashboard() {
    document.getElementById("driver-auth").style.display = "none"
    document.getElementById("driver-dashboard").style.display = "block"

    // Update auth buttons
    const authButtons = document.querySelector(".auth-buttons")
    if (authButtons) {
      const t = translations[this.currentLanguage] || translations["ar"]
      authButtons.innerHTML = `
                <span class="driver-name">${t.welcome || "Welcome"} ${this.currentDriver.full_name}</span>
                <button id="logout-btn" class="btn btn-ghost">${t.logout || "Logout"}</button>
            `

      document.getElementById("logout-btn").addEventListener("click", this.handleLogout.bind(this))
    }
  }

  async handleLogout() {
    const t = translations[this.currentLanguage] || translations["ar"]
    try {
      await fetch("api.php?action=logout_driver", { method: "POST" })
      this.currentDriver = null
      this.isOnline = false

      if (this.ridesPollingInterval) {
        clearInterval(this.ridesPollingInterval)
      }

      if (this.locationUpdateInterval) {
        clearInterval(this.locationUpdateInterval)
      }

      document.getElementById("driver-dashboard").style.display = "none"
      document.getElementById("driver-auth").style.display = "block"

      // Reset auth buttons
      const authButtons = document.querySelector(".auth-buttons")
      if (authButtons) {
        authButtons.innerHTML = `
                    <button id="login-btn" class="btn btn-ghost">${t.login || "Login"}</button>
                    <button id="register-btn" class="btn btn-primary">${t.register || "Register"}</button>
                `
      }

      this.showNotification(t.logout_success || "Logout successful", "success")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  async toggleDriverStatus() {
    const statusToggle = document.getElementById("driver-status-toggle")
    const statusText = document.getElementById("status-text")
    const statusIndicator = document.getElementById("status-indicator")
    const currentStatusText = document.getElementById("current-status-text")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (!this.currentDriver) {
      statusToggle.checked = false
      this.showNotification("Please login first", "error")
      return
    }

    this.isOnline = statusToggle.checked

    try {
      const response = await fetch("api.php?action=update_driver_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: this.currentDriver.id,
          status: this.isOnline ? "available" : "offline",
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (this.isOnline) {
          statusText.textContent = t.online || "Online"
          currentStatusText.textContent = t.available || "Available"
          statusIndicator.querySelector(".status-dot").className = "status-dot available"
          this.onlineStartTime = new Date()
          this.startLocationUpdates()
          this.startRidesPolling()
          this.startOnlineTimer()
        } else {
          statusText.textContent = t.offline || "Offline"
          currentStatusText.textContent = t.offline || "Offline"
          statusIndicator.querySelector(".status-dot").className = "status-dot offline"
          this.stopLocationUpdates()
          this.stopRidesPolling()
          this.stopOnlineTimer()
        }
      } else {
        statusToggle.checked = !this.isOnline
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      statusToggle.checked = !this.isOnline
      this.showNotification("Failed to update status", "error")
    }
  }

  startLocationUpdates() {
    if (navigator.geolocation) {
      this.locationUpdateInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.updateDriverLocation(position.coords.latitude, position.coords.longitude)
          },
          (error) => {
            console.error("Location error:", error)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        )
      }, 30000) // Update every 30 seconds
    }
  }

  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval)
      this.locationUpdateInterval = null
    }
  }

  async updateDriverLocation(lat, lng) {
    try {
      await fetch("api.php?action=update_driver_location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: this.currentDriver.id,
          lat: lat,
          lng: lng,
        }),
      })
    } catch (error) {
      console.error("Failed to update location:", error)
    }
  }

  startRidesPolling() {
    this.loadAvailableRides()
    this.ridesPollingInterval = setInterval(() => {
      this.loadAvailableRides()
    }, 10000) // Poll every 10 seconds
  }

  stopRidesPolling() {
    if (this.ridesPollingInterval) {
      clearInterval(this.ridesPollingInterval)
      this.ridesPollingInterval = null
    }
  }

  async loadAvailableRides() {
    if (!this.isOnline || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `api.php?action=get_nearby_rides&lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          )
          const result = await response.json()

          if (result.success) {
            this.renderAvailableRides(result.data)
          }
        } catch (error) {
          console.error("Failed to load rides:", error)
        }
      },
      (error) => {
        console.error("Location error:", error)
      },
    )
  }

  renderAvailableRides(rides) {
    const ridesList = document.getElementById("available-rides-list")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (rides.length === 0) {
      ridesList.innerHTML = `
                <div class="no-rides">
                    <i class="fas fa-car"></i>
                    <p>${t.no_rides_available || "No rides available"}</p>
                </div>
            `
      return
    }

    ridesList.innerHTML = rides
      .map(
        (ride) => `
            <div class="ride-item">
                <div class="ride-header">
                    <span class="ride-id">#${ride.id}</span>
                    <span class="ride-distance">${ride.distance.toFixed(1)} ${t.km || "km"}</span>
                </div>
                <div class="ride-locations">
                    <div class="location-item">
                        <i class="fas fa-circle"></i>
                        <span>${ride.pickup_address}</span>
                    </div>
                    <div class="location-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${ride.dropoff_address}</span>
                    </div>
                </div>
                <div class="ride-footer">
                    <span class="ride-fare">${this.formatCurrency(ride.estimated_fare)}</span>
                    <button class="btn btn-primary accept-ride-btn" data-ride-id="${ride.id}">
                        ${t.accept_ride || "Accept"}
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  async acceptRide(rideId) {
    const t = translations[this.currentLanguage] || translations["ar"]

    try {
      const response = await fetch("api.php?action=accept_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: rideId,
          driver_id: this.currentDriver.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        this.currentRide = { id: rideId }
        this.showNotification(t.ride_accepted || "Ride accepted!", "success")
        this.loadCurrentRide()
        this.stopRidesPolling()

        // Update status
        const statusIndicator = document.getElementById("status-indicator")
        const currentStatusText = document.getElementById("current-status-text")
        statusIndicator.querySelector(".status-dot").className = "status-dot on_ride"
        currentStatusText.textContent = t.on_ride || "On Ride"
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to accept ride", "error")
    }
  }

  async loadCurrentRide() {
    if (!this.currentRide) return

    try {
      const response = await fetch(`api.php?action=get_ride_status&ride_id=${this.currentRide.id}`)
      const result = await response.json()

      if (result.success) {
        this.renderCurrentRide(result.data)
      }
    } catch (error) {
      console.error("Failed to load current ride:", error)
    }
  }

  renderCurrentRide(ride) {
    const currentRideCard = document.getElementById("current-ride-card")
    const currentRideDetails = document.getElementById("current-ride-details")
    const t = translations[this.currentLanguage] || translations["ar"]

    currentRideCard.style.display = "block"

    currentRideDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">${t.user || "User"}:</span>
                <span class="detail-value">${ride.user_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${t.phone || "Phone"}:</span>
                <span class="detail-value">
                    <a href="tel:${ride.user_mobile}">${ride.user_mobile}</a>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${t.from || "From"}:</span>
                <span class="detail-value">${ride.pickup_address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${t.to || "To"}:</span>
                <span class="detail-value">${ride.dropoff_address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${t.fare || "Fare"}:</span>
                <span class="detail-value">${this.formatCurrency(ride.estimated_fare)}</span>
            </div>
        `

    // Show appropriate action buttons based on ride status
    const arrivedBtn = document.getElementById("arrived-btn")
    const startRideBtn = document.getElementById("start-ride-btn")
    const completeRideBtn = document.getElementById("complete-ride-btn")

    arrivedBtn.style.display = ride.status === "accepted" ? "block" : "none"
    startRideBtn.style.display = ride.status === "driver_arrived" ? "block" : "none"
    completeRideBtn.style.display = ride.status === "in_progress" ? "block" : "none"
  }

  async updateRideStatus(status) {
    const t = translations[this.currentLanguage] || translations["ar"]

    try {
      const response = await fetch("api.php?action=update_ride_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: this.currentRide.id,
          status: status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.status_updated || "Status updated!", "success")
        this.loadCurrentRide()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to update status", "error")
    }
  }

  async completeRide() {
    const t = translations[this.currentLanguage] || translations["ar"]

    try {
      const response = await fetch("api.php?action=complete_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: this.currentRide.id,
          fare: this.currentRide.estimated_fare,
          currency: this.currentCurrency,
          payment_method: "cash",
        }),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.ride_completed || "Ride completed!", "success")
        this.currentRide = null
        document.getElementById("current-ride-card").style.display = "none"

        // Update status back to available
        const statusIndicator = document.getElementById("status-indicator")
        const currentStatusText = document.getElementById("current-status-text")
        statusIndicator.querySelector(".status-dot").className = "status-dot available"
        currentStatusText.textContent = t.available || "Available"

        this.startRidesPolling()
        this.loadDriverStats()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to complete ride", "error")
    }
  }

  async cancelRide() {
    const t = translations[this.currentLanguage] || translations["ar"]

    if (!confirm(t.confirm_cancel || "Are you sure you want to cancel this ride?")) {
      return
    }

    try {
      const response = await fetch("api.php?action=cancel_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: this.currentRide.id,
          cancelled_by: "driver",
        }),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.ride_cancelled || "Ride cancelled", "success")
        this.currentRide = null
        document.getElementById("current-ride-card").style.display = "none"

        // Update status back to available
        const statusIndicator = document.getElementById("status-indicator")
        const currentStatusText = document.getElementById("current-status-text")
        statusIndicator.querySelector(".status-dot").className = "status-dot available"
        currentStatusText.textContent = t.available || "Available"

        this.startRidesPolling()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to cancel ride", "error")
    }
  }

  async loadDriverStats() {
    try {
      const response = await fetch(`api.php?action=get_driver_stats&driver_id=${this.currentDriver.id}`)
      const result = await response.json()

      if (result.success) {
        this.updateStatsDisplay(result.data)
      }
    } catch (error) {
      console.error("Failed to load driver stats:", error)
    }
  }

  updateStatsDisplay(stats) {
    document.getElementById("rides-today").textContent = stats.rides_today || 0
    document.getElementById("earnings-today").innerHTML = `${this.formatCurrency(stats.earnings_today || 0)}`
    document.getElementById("today-earnings").innerHTML = `${this.formatCurrency(stats.earnings_today || 0)}`
    document.getElementById("week-earnings").innerHTML = `${this.formatCurrency(stats.earnings_week || 0)}`
    document.getElementById("month-earnings").innerHTML = `${this.formatCurrency(stats.earnings_month || 0)}`
  }

  startOnlineTimer() {
    this.onlineTimer = setInterval(() => {
      if (this.onlineStartTime) {
        const now = new Date()
        const diff = now - this.onlineStartTime
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        document.getElementById("online-time").textContent =
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }
    }, 1000)
  }

  stopOnlineTimer() {
    if (this.onlineTimer) {
      clearInterval(this.onlineTimer)
      this.onlineTimer = null
    }
    document.getElementById("online-time").textContent = "00:00:00"
  }

  formatCurrency(amount) {
    const currencyInfo = this.supportedCurrencies[this.currentCurrency] || this.supportedCurrencies["SAR"]
    const formattedAmount = Math.round(amount).toLocaleString()
    return `${currencyInfo.symbol}${formattedAmount}`
  }

  hideAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active")
    })
    document.body.style.overflow = ""
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
    // Check if driver is already logged in
    // This would typically check session or token
  }
}

// Initialize the driver application
document.addEventListener("DOMContentLoaded", () => {
  new DriverApp()
})
