import { Chart } from "@/components/ui/chart"
// Admin Dashboard Application
const translations = {
  ar: {
    login_success: "تسجيل الدخول ناجح",
    logout_success: "تسجيل الخروج ناجح",
    no_recent_activity: "لا يوجد نشاط حديث",
    rides: "رحلات",
    not_assigned: "غير مكلف",
    no_rides_found: "لم يتم العثور على رحلات",
    no_drivers_found: "لم يتم العثور على سائقين",
    no_users_found: "لم يتم العثور على المستخدمين",
    no_payments_found: "لم يتم العثور على المدفوعات",
    no_routes_data: "لا يوجد بيانات عن الطرق",
    days_ago: "أيام مضت",
    hours_ago: "ساعات مضت",
    minutes_ago: "دقائق مضت",
    just_now: "الآن",
    confirm_cancel_ride: "هل أنت متأكد من إلغاء هذه الرحلة؟",
    confirm_suspend_driver: "هل أنت متأكد من إيقاف هذا السائق؟",
    ride_cancelled: "تم إلغاء الرحلة بنجاح",
    driver_suspended: "تم إيقاف السائق بنجاح",
    settings_saved: "تم حفظ الإعدادات بنجاح",
  },
  en: {
    login_success: "Login successful",
    logout_success: "Logout successful",
    no_recent_activity: "No recent activity",
    rides: "Rides",
    not_assigned: "Not assigned",
    no_rides_found: "No rides found",
    no_drivers_found: "No drivers found",
    no_users_found: "No users found",
    no_payments_found: "No payments found",
    no_routes_data: "No routes data",
    days_ago: "Days ago",
    hours_ago: "Hours ago",
    minutes_ago: "Minutes ago",
    just_now: "Just now",
    confirm_cancel_ride: "Are you sure you want to cancel this ride?",
    confirm_suspend_driver: "Are you sure you want to suspend this driver?",
    ride_cancelled: "Ride cancelled successfully",
    driver_suspended: "Driver suspended successfully",
    settings_saved: "Settings saved successfully",
  },
}

class AdminApp {
  constructor() {
    this.currentAdmin = null
    this.currentSection = "dashboard"
    this.currentLanguage = localStorage.getItem("preferred_language") || "ar"
    this.currentCurrency = localStorage.getItem("preferred_currency") || "SAR"
    this.supportedCurrencies = {}
    this.supportedLanguages = {}
    this.charts = {}

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

    // Sidebar navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const section = e.currentTarget.dataset.section
        this.switchSection(section)
      })
    })

    // Sidebar toggle
    const sidebarToggle = document.querySelector(".sidebar-toggle")
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", this.toggleSidebar.bind(this))
    }

    // Admin login form
    const adminLoginForm = document.getElementById("admin-login-form")
    if (adminLoginForm) {
      adminLoginForm.addEventListener("submit", this.handleAdminLogin.bind(this))
    }

    // Admin logout
    const adminLogoutBtn = document.getElementById("admin-logout-btn")
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener("click", this.handleAdminLogout.bind(this))
    }

    // Search and filter events
    this.bindSearchAndFilterEvents()

    // Settings forms
    this.bindSettingsEvents()

    // Chart filter events
    this.bindChartFilterEvents()

    // Refresh buttons
    document.getElementById("refresh-activity")?.addEventListener("click", this.loadRecentActivity.bind(this))
  }

  bindSearchAndFilterEvents() {
    // Rides search and filter
    const ridesSearch = document.getElementById("rides-search")
    const ridesFilter = document.getElementById("rides-filter")

    if (ridesSearch) {
      ridesSearch.addEventListener(
        "input",
        this.debounce(() => this.loadRides(), 500),
      )
    }

    if (ridesFilter) {
      ridesFilter.addEventListener("change", () => this.loadRides())
    }

    // Drivers search and filter
    const driversSearch = document.getElementById("drivers-search")
    const driversFilter = document.getElementById("drivers-filter")

    if (driversSearch) {
      driversSearch.addEventListener(
        "input",
        this.debounce(() => this.loadDrivers(), 500),
      )
    }

    if (driversFilter) {
      driversFilter.addEventListener("change", () => this.loadDrivers())
    }

    // Users search
    const usersSearch = document.getElementById("users-search")
    if (usersSearch) {
      usersSearch.addEventListener(
        "input",
        this.debounce(() => this.loadUsers(), 500),
      )
    }

    // Payments search and filter
    const paymentsSearch = document.getElementById("payments-search")
    const paymentsFilter = document.getElementById("payments-filter")

    if (paymentsSearch) {
      paymentsSearch.addEventListener(
        "input",
        this.debounce(() => this.loadPayments(), 500),
      )
    }

    if (paymentsFilter) {
      paymentsFilter.addEventListener("change", () => this.loadPayments())
    }
  }

  bindSettingsEvents() {
    const generalSettingsForm = document.getElementById("general-settings-form")
    const pricingSettingsForm = document.getElementById("pricing-settings-form")

    if (generalSettingsForm) {
      generalSettingsForm.addEventListener("submit", this.handleGeneralSettings.bind(this))
    }

    if (pricingSettingsForm) {
      pricingSettingsForm.addEventListener("submit", this.handlePricingSettings.bind(this))
    }
  }

  bindChartFilterEvents() {
    const ridesChartFilter = document.getElementById("rides-chart-filter")
    const revenueChartFilter = document.getElementById("revenue-chart-filter")
    const analyticsPeriod = document.getElementById("analytics-period")

    if (ridesChartFilter) {
      ridesChartFilter.addEventListener("change", () => this.updateRidesChart())
    }

    if (revenueChartFilter) {
      revenueChartFilter.addEventListener("change", () => this.updateRevenueChart())
    }

    if (analyticsPeriod) {
      analyticsPeriod.addEventListener("change", () => this.loadAnalytics())
    }
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
    this.loadDashboardStats()
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

  toggleSidebar() {
    const sidebar = document.querySelector(".admin-sidebar")
    sidebar.classList.toggle("active")
  }

  switchSection(sectionName) {
    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })
    document.querySelector(`[data-section="${sectionName}"]`).classList.add("active")

    // Update sections
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(`${sectionName}-section`).classList.add("active")

    // Update page title
    const t = translations[this.currentLanguage] || translations["ar"]
    const pageTitle = document.getElementById("page-title")
    if (pageTitle) {
      pageTitle.textContent = t[sectionName] || sectionName
    }

    this.currentSection = sectionName

    // Load section data
    this.loadSectionData(sectionName)
  }

  async loadSectionData(section) {
    switch (section) {
      case "dashboard":
        await this.loadDashboardStats()
        await this.loadRecentActivity()
        this.initializeCharts()
        break
      case "rides":
        await this.loadRides()
        break
      case "drivers":
        await this.loadDrivers()
        break
      case "users":
        await this.loadUsers()
        break
      case "payments":
        await this.loadPayments()
        break
      case "analytics":
        await this.loadAnalytics()
        break
      case "settings":
        await this.loadSettings()
        break
    }
  }

  async handleAdminLogin(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const email = document.getElementById("admin-email").value
    const password = document.getElementById("admin-password").value

    try {
      const response = await fetch("api.php?action=admin_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        this.currentAdmin = result.data
        this.hideAdminLoginModal()
        this.showNotification(t.login_success || "Login successful!", "success")
        this.loadDashboardStats()
        this.loadRecentActivity()
        this.initializeCharts()

        // Update admin info
        document.getElementById("admin-name").textContent = this.currentAdmin.full_name
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to login", "error")
    }
  }

  async handleAdminLogout() {
    const t = translations[this.currentLanguage] || translations["ar"]
    try {
      await fetch("api.php?action=admin_logout", { method: "POST" })
      this.currentAdmin = null
      this.showAdminLoginModal()
      this.showNotification(t.logout_success || "Logout successful", "success")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  showAdminLoginModal() {
    const modal = document.getElementById("admin-login-modal")
    if (modal) {
      modal.classList.add("active")
      document.body.style.overflow = "hidden"
    }
  }

  hideAdminLoginModal() {
    const modal = document.getElementById("admin-login-modal")
    if (modal) {
      modal.classList.remove("active")
      document.body.style.overflow = ""
    }
  }

  async loadDashboardStats() {
    try {
      const response = await fetch("api.php?action=get_admin_stats")
      const result = await response.json()

      if (result.success) {
        this.updateStatsDisplay(result.data)
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
    }
  }

  updateStatsDisplay(stats) {
    document.getElementById("total-rides").textContent = stats.total_rides || 0
    document.getElementById("active-drivers").textContent = stats.active_drivers || 0
    document.getElementById("total-users").textContent = stats.total_users || 0
    document.getElementById("total-revenue").innerHTML = `${this.formatCurrency(stats.total_revenue || 0)}`
  }

  async loadRecentActivity() {
    try {
      const response = await fetch("api.php?action=get_recent_activity")
      const result = await response.json()

      if (result.success) {
        this.renderRecentActivity(result.data)
      }
    } catch (error) {
      console.error("Failed to load recent activity:", error)
    }
  }

  renderRecentActivity(activities) {
    const activityList = document.getElementById("recent-activity-list")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (activities.length === 0) {
      activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>${t.no_recent_activity || "No recent activity"}</h3>
                </div>
            `
      return
    }

    activityList.innerHTML = activities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${this.formatTime(activity.created_at)}</div>
            </div>
        `,
      )
      .join("")
  }

  getActivityIcon(type) {
    const icons = {
      ride: "car",
      payment: "credit-card",
      driver: "user",
      user: "user-plus",
    }
    return icons[type] || "info-circle"
  }

  initializeCharts() {
    this.initializeRidesChart()
    this.initializeRevenueChart()
  }

  async initializeRidesChart() {
    const ctx = document.getElementById("rides-chart")
    if (!ctx) return

    try {
      const response = await fetch("api.php?action=get_rides_chart_data&period=7")
      const result = await response.json()

      if (result.success) {
        if (this.charts.rides) {
          this.charts.rides.destroy()
        }

        this.charts.rides = new Chart(ctx, {
          type: "line",
          data: {
            labels: result.data.labels,
            datasets: [
              {
                label: "Rides",
                data: result.data.values,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        })
      }
    } catch (error) {
      console.error("Failed to load rides chart:", error)
    }
  }

  async initializeRevenueChart() {
    const ctx = document.getElementById("revenue-chart")
    if (!ctx) return

    try {
      const response = await fetch(`api.php?action=get_revenue_chart_data&period=7&currency=${this.currentCurrency}`)
      const result = await response.json()

      if (result.success) {
        if (this.charts.revenue) {
          this.charts.revenue.destroy()
        }

        this.charts.revenue = new Chart(ctx, {
          type: "bar",
          data: {
            labels: result.data.labels,
            datasets: [
              {
                label: "Revenue",
                data: result.data.values,
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderColor: "rgb(16, 185, 129)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        })
      }
    } catch (error) {
      console.error("Failed to load revenue chart:", error)
    }
  }

  async updateRidesChart() {
    const period = document.getElementById("rides-chart-filter").value
    await this.initializeRidesChart()
  }

  async updateRevenueChart() {
    const period = document.getElementById("revenue-chart-filter").value
    await this.initializeRevenueChart()
  }

  async loadRides(page = 1) {
    const search = document.getElementById("rides-search")?.value || ""
    const filter = document.getElementById("rides-filter")?.value || "all"

    try {
      const response = await fetch(
        `api.php?action=get_rides&page=${page}&search=${encodeURIComponent(search)}&filter=${filter}`,
      )
      const result = await response.json()

      if (result.success) {
        this.renderRidesTable(result.data.rides)
        this.renderPagination("rides", result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to load rides:", error)
    }
  }

  renderRidesTable(rides) {
    const tbody = document.getElementById("rides-table-body")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (rides.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-car"></i>
                        <h3>${t.no_rides_found || "No rides found"}</h3>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = rides
      .map(
        (ride) => `
            <tr>
                <td>#${ride.id}</td>
                <td>${ride.user_name}</td>
                <td>${ride.driver_name || t.not_assigned || "Not assigned"}</td>
                <td>${ride.pickup_address}</td>
                <td>${ride.dropoff_address}</td>
                <td>${this.formatCurrency(ride.fare || ride.estimated_fare)}</td>
                <td><span class="status-badge ${ride.status}">${t[ride.status] || ride.status}</span></td>
                <td>${this.formatDate(ride.requested_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-small" onclick="adminApp.viewRide(${ride.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.cancelRide(${ride.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  async loadDrivers(page = 1) {
    const search = document.getElementById("drivers-search")?.value || ""
    const filter = document.getElementById("drivers-filter")?.value || "all"

    try {
      const response = await fetch(
        `api.php?action=get_drivers&page=${page}&search=${encodeURIComponent(search)}&filter=${filter}`,
      )
      const result = await response.json()

      if (result.success) {
        this.renderDriversTable(result.data.drivers)
        this.renderPagination("drivers", result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to load drivers:", error)
    }
  }

  renderDriversTable(drivers) {
    const tbody = document.getElementById("drivers-table-body")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (drivers.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>${t.no_drivers_found || "No drivers found"}</h3>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = drivers
      .map(
        (driver) => `
            <tr>
                <td>#${driver.id}</td>
                <td>${driver.full_name}</td>
                <td>${driver.email}</td>
                <td>${driver.mobile}</td>
                <td>${driver.vehicle_color} ${driver.vehicle_model}<br><small>${driver.license_plate}</small></td>
                <td>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${driver.rating || "N/A"}</span>
                    </div>
                </td>
                <td><span class="status-badge ${driver.status}">${t[driver.status] || driver.status}</span></td>
                <td>${this.formatDate(driver.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-small" onclick="adminApp.viewDriver(${driver.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning btn-small" onclick="adminApp.suspendDriver(${driver.id})">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  async loadUsers(page = 1) {
    const search = document.getElementById("users-search")?.value || ""

    try {
      const response = await fetch(`api.php?action=get_users&page=${page}&search=${encodeURIComponent(search)}`)
      const result = await response.json()

      if (result.success) {
        this.renderUsersTable(result.data.users)
        this.renderPagination("users", result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  renderUsersTable(users) {
    const tbody = document.getElementById("users-table-body")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (users.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <h3>${t.no_users_found || "No users found"}</h3>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>#${user.id}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.mobile}</td>
                <td>${user.total_rides || 0}</td>
                <td>${this.formatCurrency(user.total_spent || 0)}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-small" onclick="adminApp.viewUser(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  async loadPayments(page = 1) {
    const search = document.getElementById("payments-search")?.value || ""
    const filter = document.getElementById("payments-filter")?.value || "all"

    try {
      const response = await fetch(
        `api.php?action=get_payments&page=${page}&search=${encodeURIComponent(search)}&filter=${filter}`,
      )
      const result = await response.json()

      if (result.success) {
        this.renderPaymentsTable(result.data.payments)
        this.renderPagination("payments", result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to load payments:", error)
    }
  }

  renderPaymentsTable(payments) {
    const tbody = document.getElementById("payments-table-body")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (payments.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-credit-card"></i>
                        <h3>${t.no_payments_found || "No payments found"}</h3>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = payments
      .map(
        (payment) => `
            <tr>
                <td>#${payment.id}</td>
                <td>#${payment.ride_id}</td>
                <td>${this.formatCurrency(payment.amount)}</td>
                <td>${payment.currency}</td>
                <td>${t[payment.method] || payment.method}</td>
                <td><span class="status-badge ${payment.status}">${t[payment.status] || payment.status}</span></td>
                <td>${payment.transaction_id || "N/A"}</td>
                <td>${this.formatDate(payment.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-small" onclick="adminApp.viewPayment(${payment.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  async loadAnalytics() {
    const period = document.getElementById("analytics-period")?.value || "30"

    try {
      const response = await fetch(`api.php?action=get_analytics&period=${period}`)
      const result = await response.json()

      if (result.success) {
        this.renderAnalytics(result.data)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    }
  }

  renderAnalytics(analytics) {
    this.renderRidesByHourChart(analytics.rides_by_hour)
    this.renderPopularRoutes(analytics.popular_routes)
    this.renderPaymentMethodsChart(analytics.payment_methods)
    this.renderDriverPerformance(analytics.driver_performance)
  }

  renderRidesByHourChart(data) {
    const ctx = document.getElementById("rides-by-hour-chart")
    if (!ctx) return

    if (this.charts.ridesByHour) {
      this.charts.ridesByHour.destroy()
    }

    this.charts.ridesByHour = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Rides",
            data: data.values,
            backgroundColor: "rgba(59, 130, 246, 0.8)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  }

  renderPopularRoutes(routes) {
    const routesList = document.getElementById("popular-routes-list")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (routes.length === 0) {
      routesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-route"></i>
                    <h3>${t.no_routes_data || "No routes data"}</h3>
                </div>
            `
      return
    }

    routesList.innerHTML = routes
      .map(
        (route) => `
            <div class="route-item">
                <div class="route-info">
                    <div class="route-name">${route.from} → ${route.to}</div>
                    <div class="route-count">${route.count} ${t.rides || "rides"}</div>
                </div>
                <div class="route-percentage">${route.percentage}%</div>
            </div>
        `,
      )
      .join("")
  }

  renderPaymentMethodsChart(data) {
    const ctx = document.getElementById("payment-methods-chart")
    if (!ctx) return

    if (this.charts.paymentMethods) {
      this.charts.paymentMethods.destroy()
    }

    this.charts.paymentMethods = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  renderDriverPerformance(drivers) {
    const performanceList = document.getElementById("driver-performance-list")
    const t = translations[this.currentLanguage] || translations["ar"]

    if (drivers.length === 0) {
      performanceList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>${t.no_performance_data || "No performance data"}</h3>
                </div>
            `
      return
    }

    performanceList.innerHTML = drivers
      .map(
        (driver) => `
            <div class="performance-item">
                <div class="performance-info">
                    <div class="driver-name">${driver.name}</div>
                    <div class="driver-stats">${driver.rides} ${t.rides || "rides"} • ${this.formatCurrency(driver.earnings)}</div>
                </div>
                <div class="performance-score">
                    <i class="fas fa-star"></i>
                    ${driver.rating}
                </div>
            </div>
        `,
      )
      .join("")
  }

  async loadSettings() {
    try {
      const response = await fetch("api.php?action=get_settings")
      const result = await response.json()

      if (result.success) {
        this.populateSettingsForm(result.data)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  populateSettingsForm(settings) {
    document.getElementById("app-name").value = settings.app_name || "TaxiHub"
    document.getElementById("default-currency").value = settings.default_currency || "SAR"
    document.getElementById("default-language").value = settings.default_language || "ar"
    document.getElementById("base-fare").value = settings.base_fare || "5.00"
    document.getElementById("per-km-rate").value = settings.per_km_rate || "1.50"
    document.getElementById("commission-rate").value = settings.commission_rate || "20.0"
  }

  async handleGeneralSettings(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const settings = {
      app_name: document.getElementById("app-name").value,
      default_currency: document.getElementById("default-currency").value,
      default_language: document.getElementById("default-language").value,
    }

    try {
      const response = await fetch("api.php?action=update_general_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.settings_saved || "Settings saved successfully!", "success")
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to save settings", "error")
    }
  }

  async handlePricingSettings(e) {
    e.preventDefault()
    const t = translations[this.currentLanguage] || translations["ar"]

    const settings = {
      base_fare: Number.parseFloat(document.getElementById("base-fare").value),
      per_km_rate: Number.parseFloat(document.getElementById("per-km-rate").value),
      commission_rate: Number.parseFloat(document.getElementById("commission-rate").value),
    }

    try {
      const response = await fetch("api.php?action=update_pricing_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.settings_saved || "Settings saved successfully!", "success")
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to save settings", "error")
    }
  }

  renderPagination(section, pagination) {
    const paginationContainer = document.getElementById(`${section}-pagination`)
    if (!paginationContainer || !pagination) return

    const { current_page, total_pages, has_prev, has_next } = pagination

    let paginationHTML = `
            <button ${!has_prev ? "disabled" : ""} onclick="adminApp.load${section.charAt(0).toUpperCase() + section.slice(1)}(${current_page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `

    // Show page numbers
    for (let i = Math.max(1, current_page - 2); i <= Math.min(total_pages, current_page + 2); i++) {
      paginationHTML += `
                <button class="${i === current_page ? "active" : ""}" onclick="adminApp.load${section.charAt(0).toUpperCase() + section.slice(1)}(${i})">
                    ${i}
                </button>
            `
    }

    paginationHTML += `
            <button ${!has_next ? "disabled" : ""} onclick="adminApp.load${section.charAt(0).toUpperCase() + section.slice(1)}(${current_page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `

    paginationContainer.innerHTML = paginationHTML
  }

  // Action methods
  async viewRide(rideId) {
    // Implementation for viewing ride details
    console.log("View ride:", rideId)
  }

  async cancelRide(rideId) {
    const t = translations[this.currentLanguage] || translations["ar"]
    if (!confirm(t.confirm_cancel_ride || "Are you sure you want to cancel this ride?")) {
      return
    }

    try {
      const response = await fetch("api.php?action=admin_cancel_ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ride_id: rideId }),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.ride_cancelled || "Ride cancelled successfully", "success")
        this.loadRides()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to cancel ride", "error")
    }
  }

  async viewDriver(driverId) {
    // Implementation for viewing driver details
    console.log("View driver:", driverId)
  }

  async suspendDriver(driverId) {
    const t = translations[this.currentLanguage] || translations["ar"]
    if (!confirm(t.confirm_suspend_driver || "Are you sure you want to suspend this driver?")) {
      return
    }

    try {
      const response = await fetch("api.php?action=suspend_driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification(t.driver_suspended || "Driver suspended successfully", "success")
        this.loadDrivers()
      } else {
        this.showNotification(result.message, "error")
      }
    } catch (error) {
      this.showNotification("Failed to suspend driver", "error")
    }
  }

  async viewUser(userId) {
    // Implementation for viewing user details
    console.log("View user:", userId)
  }

  async viewPayment(paymentId) {
    // Implementation for viewing payment details
    console.log("View payment:", paymentId)
  }

  // Utility methods
  formatCurrency(amount) {
    const currencyInfo = this.supportedCurrencies[this.currentCurrency] || this.supportedCurrencies["SAR"]
    const formattedAmount = Math.round(amount).toLocaleString()
    return `${currencyInfo.symbol}${formattedAmount}`
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString(this.currentLanguage === "ar" ? "ar-SA" : "en-US")
  }

  formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const t = translations[this.currentLanguage] || translations["ar"]

    if (days > 0) {
      return `${days} ${t.days_ago || "days ago"}`
    } else if (hours > 0) {
      return `${hours} ${t.hours_ago || "hours ago"}`
    } else if (minutes > 0) {
      return `${minutes} ${t.minutes_ago || "minutes ago"}`
    } else {
      return t.just_now || "Just now"
    }
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
    // Check if admin is already logged in
    // For demo purposes, we'll show the login modal
    this.showAdminLoginModal()
  }
}

// Initialize the admin application
let adminApp
document.addEventListener("DOMContentLoaded", () => {
  adminApp = new AdminApp()
})
