#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@interface ZenAudioModule : NSObject <RCTBridgeModule, AVAudioPlayerDelegate>
@property (nonatomic, strong) AVAudioPlayer *audioPlayer;
@property (nonatomic, strong) AVAudioPlayer *chimePlayer;
@property (nonatomic, assign) BOOL userWantsPlay;
@end
