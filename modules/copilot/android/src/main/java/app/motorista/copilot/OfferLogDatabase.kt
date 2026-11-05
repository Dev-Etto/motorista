package app.motorista.copilot

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class OfferLogDatabase private constructor(context: Context) : SQLiteOpenHelper(context, FILE, null, VERSION) {
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE offers (timestamp INTEGER PRIMARY KEY, data TEXT NOT NULL)")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

  @Synchronized
  fun isEmpty(): Boolean = readableDatabase.rawQuery("SELECT 1 FROM offers LIMIT 1", null).use { it.count == 0 }

  @Synchronized
  fun insert(entry: JSONObject, oldestToKeep: Long) {
    writableDatabase.insertWithOnConflict(TABLE, null, valuesOf(entry), SQLiteDatabase.CONFLICT_REPLACE)
    writableDatabase.delete(TABLE, "timestamp < ?", arrayOf(oldestToKeep.toString()))
  }

  @Synchronized
  fun update(timestamp: Long, change: (JSONObject) -> Unit) {
    val raw = readableDatabase.rawQuery("SELECT data FROM offers WHERE timestamp = ?", arrayOf(timestamp.toString())).use {
      if (it.moveToFirst()) it.getString(0) else null
    } ?: return
    val entry = JSONObject(raw).also(change)
    writableDatabase.update(TABLE, valuesOf(entry), "timestamp = ?", arrayOf(timestamp.toString()))
  }

  @Synchronized
  fun between(from: Long, to: Long): String =
    query("SELECT data FROM offers WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp DESC", arrayOf(from.toString(), to.toString()))

  @Synchronized
  fun recent(limit: Int): String = query("SELECT data FROM offers ORDER BY timestamp DESC LIMIT ?", arrayOf(limit.toString()))

  @Synchronized
  fun all(): String = query("SELECT data FROM offers ORDER BY timestamp DESC", emptyArray())

  @Synchronized
  fun replaceAll(entries: JSONArray) {
    val db = writableDatabase
    db.beginTransaction()
    try {
      db.delete(TABLE, null, null)
      for (index in 0 until entries.length()) {
        db.insertWithOnConflict(TABLE, null, valuesOf(entries.getJSONObject(index)), SQLiteDatabase.CONFLICT_REPLACE)
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
  }

  @Synchronized
  fun clear() {
    writableDatabase.delete(TABLE, null, null)
  }

  private fun query(sql: String, args: Array<String>): String = readableDatabase.rawQuery(sql, args).use { cursor ->
    val rows = generateSequence { if (cursor.moveToNext()) cursor.getString(0) else null }
    rows.joinToString(",", "[", "]")
  }

  private fun valuesOf(entry: JSONObject) = ContentValues().apply {
    put("timestamp", entry.optLong("timestamp"))
    put("data", entry.toString())
  }

  companion object {
    private const val FILE = "offer_log.db"
    private const val TABLE = "offers"
    private const val VERSION = 1

    @Volatile
    private var instance: OfferLogDatabase? = null

    fun get(context: Context): OfferLogDatabase = instance ?: synchronized(this) {
      instance ?: OfferLogDatabase(context.applicationContext).also { instance = it }
    }
  }
}
