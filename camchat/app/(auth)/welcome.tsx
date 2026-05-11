/**
 * Welcome Screen (Onboarding)
 * Swipeable onboarding slides with 3 screens
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
}

const slides: SlideData[] = [
  {
    id: '1',
    icon: 'chatbubbles',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
  },
  {
    id: '2',
    icon: 'radio',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
  },
  {
    id: '3',
    icon: 'videocam',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
  },
];

interface SlideItemProps {
  item: SlideData;
}

function SlideItem({ item }: SlideItemProps) {
  return (
    <View style={styles.slide}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationPlaceholder}>
          <Ionicons name={item.icon} size={120} color={Colors.textInverse} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.subtitle}>{t(item.subtitleKey)}</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const handleGetStarted = () => {
    router.push('/(auth)/phone');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/phone');
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <SlideItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {isLastSlide ? t('onboarding.getStarted') : t('common.next')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xxl,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textInverse,
    opacity: 0.4,
    marginHorizontal: Spacing.xs,
  },
  dotActive: {
    opacity: 1,
    width: 24,
  },
  button: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.textInverse,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
});
