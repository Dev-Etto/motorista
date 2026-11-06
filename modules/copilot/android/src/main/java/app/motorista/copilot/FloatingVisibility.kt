package app.motorista.copilot

class FloatingVisibility {
  private var appInForeground = false
  private var hiddenForNow = false

  val visible: Boolean
    get() = !appInForeground && !hiddenForNow

  fun onAppForeground(value: Boolean) {
    appInForeground = value
    if (value) hiddenForNow = false
  }

  fun hideForNow() {
    hiddenForNow = true
  }
}
