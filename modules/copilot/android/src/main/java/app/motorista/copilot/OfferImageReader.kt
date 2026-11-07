package app.motorista.copilot

import android.accessibilityservice.AccessibilityService
import android.graphics.Bitmap
import android.os.Build
import android.view.Display
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicBoolean

class OfferImageReader(
  private val service: AccessibilityService,
  private val executor: Executor,
  private val onText: (String) -> Unit,
) {
  private val recognizer by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }
  private val busy = AtomicBoolean(false)
  private var lastCaptureAt = 0L

  fun capture() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return

    val now = System.currentTimeMillis()
    if (now - lastCaptureAt < MIN_INTERVAL_MS || !busy.compareAndSet(false, true)) return

    lastCaptureAt = now
    service.takeScreenshot(Display.DEFAULT_DISPLAY, executor, object : AccessibilityService.TakeScreenshotCallback {
      override fun onSuccess(screenshot: AccessibilityService.ScreenshotResult) = read(screenshot)

      override fun onFailure(errorCode: Int) = busy.set(false)
    })
  }

  fun release() {
    if (busy.get() || lastCaptureAt > 0) recognizer.close()
  }

  private fun read(screenshot: AccessibilityService.ScreenshotResult) {
    val image = runCatching { offerArea(screenshot) }.getOrNull()
    screenshot.hardwareBuffer.close()
    if (image == null) return busy.set(false)

    runCatching {
      recognizer.process(InputImage.fromBitmap(image, 0))
        .addOnSuccessListener(executor) { runCatching { onText(textOf(it)) } }
        .addOnCompleteListener(executor) { finish(image) }
    }.onFailure { finish(image) }
  }

  private fun finish(image: Bitmap) {
    image.recycle()
    busy.set(false)
  }

  private fun offerArea(screenshot: AccessibilityService.ScreenshotResult): Bitmap {
    val hardware = Bitmap.wrapHardwareBuffer(screenshot.hardwareBuffer, screenshot.colorSpace) ?: error("sem imagem")
    val software = hardware.copy(Bitmap.Config.ARGB_8888, false)
    hardware.recycle()
    val top = OfferReadPolicy.imageTopY(software.height)
    val area = Bitmap.createBitmap(software, 0, top, software.width, software.height - top)
    if (area !== software) software.recycle()
    return area
  }

  private fun textOf(result: Text): String {
    val pieces = result.textBlocks.flatMap { block -> block.lines }.mapNotNull { line ->
      line.boundingBox?.let { TextPiece(line.text, it.left, it.top, it.right, it.bottom) }
    }
    return OfferParser.fromImageText(ScreenText.join(pieces))
  }

  private companion object {
    const val MIN_INTERVAL_MS = 1000L
  }
}
