import mammoth from "mammoth"
import AdmZip from "adm-zip"
import { PDFParse } from "pdf-parse"

// 🎯 الهدف: نعطي الذكاء الاصطناعي نص المحتوى الفعلي للملف (مو بس اسمه)، حتى
// يقدر يقارنه فعلياً بمتطلبات المشروع. مدعوم حالياً: txt/csv/json/md (نص خام)،
// docx (Word)، pdf، وملفات zip (يفتحها ويستخرج نص كل ملف مدعوم بداخلها).
//
// غير مدعوم حالياً (نرجع ملاحظة بدل تجاهل صامت): صور، .doc القديم، .xls/.xlsx،
// .ppt/.pptx. هذا اختيار مقصود لتفادي إضافة مكتبات ثقيلة إضافية الآن — يمكن
// إضافتها لاحقاً بنفس النمط لو احتجتها.

const MAX_TOTAL_CHARS = 12000 // سقف إجمالي لطول النص المُستخرج (يحافظ على تكلفة/سرعة الاستدعاء لاحقاً)
const MAX_ZIP_ENTRIES = 30 // حماية بسيطة من "zip bomb" (ملف مضغوط يحتوي آلاف الملفات)
const MAX_ENTRY_SIZE = 15 * 1024 * 1024 // 15MB لكل ملف داخل الأرشيف كحد أقصى قبل تجاهله

function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".")
  return parts.length > 1 ? parts[parts.length - 1] : ""
}

async function extractFromSingleFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = getExtension(fileName)

  try {
    if (["txt", "csv", "json", "md", "log"].includes(ext)) {
      return buffer.toString("utf-8")
    }

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    }

    if (ext === "pdf") {
      // pdf-parse v2 يصدّر class اسمه PDFParse (مو دالة مباشرة كما بالنسخة القديمة v1)
      const parser = new PDFParse({ data: buffer })
      try {
        const result = await parser.getText()
        return result.text || ""
      } finally {
        await parser.destroy()
      }
    }

    // أنواع معروفة لكن غير مدعومة للاستخراج النصي حالياً
    if (["doc", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      return `[تعذّرت قراءة محتوى هذا النوع من الملفات حالياً (${ext})، الاسم: ${fileName}]`
    }

    if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
      return `[ملف صورة، لا يمكن قراءة محتواه نصياً حالياً: ${fileName}]`
    }

    return `[نوع ملف غير معروف، لم تتم قراءة محتواه: ${fileName}]`
  } catch (err: any) {
    console.error(`⚠️ فشل استخراج نص من الملف "${fileName}":`, err?.message)
    return `[تعذّر قراءة محتوى الملف "${fileName}" (${err?.message || "خطأ غير معروف"})]`
  }
}

async function extractFromZip(buffer: Buffer, zipName: string): Promise<string> {
  let zip: AdmZip
  try {
    zip = new AdmZip(buffer)
  } catch (err: any) {
    return `[تعذّر فتح الملف المضغوط "${zipName}": ${err?.message || "خطأ غير معروف"}]`
  }

  const entries = zip.getEntries().filter((e) => !e.isDirectory)
  if (entries.length > MAX_ZIP_ENTRIES) {
    return (
      `[الملف المضغوط "${zipName}" يحتوي ${entries.length} ملفاً، أكثر من الحد المسموح ` +
      `(${MAX_ZIP_ENTRIES}) للمراجعة الآلية — تمت مراجعة أول ${MAX_ZIP_ENTRIES} ملف فقط]`
    )
  }

  const parts: string[] = []
  for (const entry of entries.slice(0, MAX_ZIP_ENTRIES)) {
    if (entry.header.size > MAX_ENTRY_SIZE) {
      parts.push(`[تم تجاوز "${entry.entryName}" (حجمه أكبر من المسموح)]`)
      continue
    }
    const innerBuffer = entry.getData()
    // لا نفتح zip داخل zip (نتجنب أي احتمال تكرار لا نهائي/zip bomb متداخل)
    if (getExtension(entry.entryName) === "zip") {
      parts.push(`[تم تجاهل أرشيف متداخل: ${entry.entryName}]`)
      continue
    }
    const text = await extractFromSingleFile(innerBuffer, entry.entryName)
    parts.push(`--- ${entry.entryName} ---\n${text}`)
  }

  return parts.join("\n\n")
}

/**
 * يستخرج نصاً قابلاً للقراءة من أي ملف مدعوم (أو أرشيف zip يحتوي ملفات مدعومة)
 * ويُرجع نصاً مُهذَّباً (مقصوصاً لسقف معقول من الأحرف) جاهزاً للإرسال للذكاء الاصطناعي.
 */
export async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = getExtension(fileName)

  const rawText = ext === "zip" ? await extractFromZip(buffer, fileName) : await extractFromSingleFile(buffer, fileName)

  const trimmed = (rawText || "").trim()
  if (trimmed.length > MAX_TOTAL_CHARS) {
    return trimmed.slice(0, MAX_TOTAL_CHARS) + `\n\n[...تم اقتصاص النص، الطول الأصلي ${trimmed.length} حرف...]`
  }
  return trimmed
}
