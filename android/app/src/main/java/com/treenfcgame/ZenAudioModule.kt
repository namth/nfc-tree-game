package com.treenfcgame

import android.media.MediaPlayer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.LifecycleEventListener

class ZenAudioModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var mediaPlayer: MediaPlayer? = null
    private var userWantsPlay = false
    private var currentVolume = 0.5f

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = "ZenAudioModule"

    private fun initPlayerIfNeeded() {
        if (mediaPlayer == null) {
            try {
                val resId = reactContext.resources.getIdentifier("zen_bgm", "raw", reactContext.packageName)
                if (resId != 0) {
                    mediaPlayer = MediaPlayer.create(reactContext, resId)?.apply {
                        isLooping = true
                        setVolume(currentVolume, currentVolume)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @ReactMethod
    fun play(promise: Promise? = null) {
        userWantsPlay = true
        try {
            initPlayerIfNeeded()
            mediaPlayer?.let { player ->
                if (!player.isPlaying) {
                    player.start()
                }
            }
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("ERR_AUDIO", e.message)
        }
    }

    @ReactMethod
    fun pause(promise: Promise? = null) {
        userWantsPlay = false
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.pause()
                }
            }
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("ERR_AUDIO", e.message)
        }
    }

    @ReactMethod
    fun stop(promise: Promise? = null) {
        userWantsPlay = false
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.stop()
                }
                player.release()
            }
            mediaPlayer = null
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("ERR_AUDIO", e.message)
        }
    }

    @ReactMethod
    fun setVolume(volume: Float, promise: Promise? = null) {
        currentVolume = volume.coerceIn(0f, 1f)
        try {
            mediaPlayer?.setVolume(currentVolume, currentVolume)
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("ERR_AUDIO", e.message)
        }
    }

    @ReactMethod
    fun isPlaying(promise: Promise) {
        val playing = mediaPlayer?.isPlaying ?: false
        promise.resolve(playing)
    }

    private var chimePlayer: MediaPlayer? = null

    @ReactMethod
    fun playChime(promise: Promise? = null) {
        try {
            val resId = reactContext.resources.getIdentifier("zen_chime", "raw", reactContext.packageName)
            if (resId != 0) {
                chimePlayer?.release()
                chimePlayer = MediaPlayer.create(reactContext, resId)?.apply {
                    setVolume(0.95f, 0.95f)
                    setOnCompletionListener { mp ->
                        mp.release()
                        if (chimePlayer == mp) {
                            chimePlayer = null
                        }
                    }
                    start()
                }
            }
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("ERR_CHIME", e.message)
        }
    }

    override fun onHostResume() {
        if (userWantsPlay) {
            initPlayerIfNeeded()
            mediaPlayer?.let { player ->
                if (!player.isPlaying) {
                    player.start()
                }
            }
        }
    }

    override fun onHostPause() {
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.pause()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onHostDestroy() {
        try {
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
