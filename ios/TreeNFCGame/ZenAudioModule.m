#import "ZenAudioModule.h"

@implementation ZenAudioModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if (self = [super init]) {
    _userWantsPlay = NO;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppDidEnterBackground:)
                                                 name:UIApplicationDidEnterBackgroundNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppWillEnterForeground:)
                                                 name:UIApplicationWillEnterForegroundNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_audioPlayer stop];
  _audioPlayer = nil;
}

- (void)initPlayerIfNeeded
{
  if (!_audioPlayer) {
    NSString *soundPath = [[NSBundle mainBundle] pathForResource:@"zen_bgm" ofType:@"mp3"];
    if (soundPath) {
      NSURL *soundURL = [NSURL fileURLWithPath:soundPath];
      NSError *error = nil;
      [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];
      [[AVAudioSession sharedInstance] setActive:YES error:nil];
      _audioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:soundURL error:&error];
      _audioPlayer.numberOfLoops = -1; // Vòng lặp vô tận
      _audioPlayer.volume = 0.5;
      [_audioPlayer prepareToPlay];
    }
  }
}

RCT_EXPORT_METHOD(play:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_userWantsPlay = YES;
    [self initPlayerIfNeeded];
    if (self->_audioPlayer) {
      [self->_audioPlayer play];
      resolve(@(YES));
    } else {
      resolve(@(NO));
    }
  });
}

RCT_EXPORT_METHOD(pause:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_userWantsPlay = NO;
    if (self->_audioPlayer && self->_audioPlayer.isPlaying) {
      [self->_audioPlayer pause];
    }
    resolve(@(YES));
  });
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_userWantsPlay = NO;
    if (self->_audioPlayer) {
      [self->_audioPlayer stop];
      self->_audioPlayer = nil;
    }
    resolve(@(YES));
  });
}

RCT_EXPORT_METHOD(setVolume:(float)volume resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_audioPlayer) {
      self->_audioPlayer.volume = MAX(0.0, MIN(1.0, volume));
    }
    resolve(@(YES));
  });
}

RCT_EXPORT_METHOD(isPlaying:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    BOOL playing = (self->_audioPlayer && self->_audioPlayer.isPlaying);
    resolve(@(playing));
  });
}

RCT_EXPORT_METHOD(playChime:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *soundPath = [[NSBundle mainBundle] pathForResource:@"zen_chime" ofType:@"wav"];
    if (!soundPath) {
      soundPath = [[NSBundle mainBundle] pathForResource:@"zen_chime" ofType:@"mp3"];
    }
    if (soundPath) {
      NSURL *soundURL = [NSURL fileURLWithPath:soundPath];
      NSError *error = nil;
      self->_chimePlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:soundURL error:&error];
      self->_chimePlayer.volume = 0.95;
      [self->_chimePlayer play];
      resolve(@(YES));
    } else {
      resolve(@(NO));
    }
  });
}

- (void)handleAppDidEnterBackground:(NSNotification *)notification
{
  if (_audioPlayer && _audioPlayer.isPlaying) {
    [_audioPlayer pause];
  }
}

- (void)handleAppWillEnterForeground:(NSNotification *)notification
{
  if (_userWantsPlay && _audioPlayer) {
    [_audioPlayer play];
  }
}

@end
