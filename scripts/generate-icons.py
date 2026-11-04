import os
import shutil
from PIL import Image

def generate_icons():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    android_icon_path = os.path.join(project_root, "android-assets", "icon.png")
    public_icon_path = os.path.join(project_root, "public", "icon.png")
    web_assets_path = os.path.join(project_root, "public", "assets", "icon.png")
    res_path = os.path.join(project_root, "android", "app", "src", "main", "res")
    splash_src_path = os.path.join(project_root, "itch-assets", "splash.png")
    splash_dest_path = os.path.join(project_root, "public", "splash.webp")

    print("==============================================")
    print("  ICON & SPLASH OPTIMIZER / GENERATOR RUNNING ")
    print("==============================================")

    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        resample_filter = Image.ANTIALIAS

    # 1. Optimize Splash Screen (itch-assets/splash.png -> public/splash.webp)
    if os.path.exists(splash_src_path):
        try:
            splash_img = Image.open(splash_src_path).convert("RGB")
            orig_w, orig_h = splash_img.size
            target_w = 900
            target_h = int(round(orig_h * (target_w / orig_w)))
            resized_splash = splash_img.resize((target_w, target_h), resample_filter)
            os.makedirs(os.path.dirname(splash_dest_path), exist_ok=True)
            resized_splash.save(splash_dest_path, "WEBP", quality=82, method=6)
            src_kb = os.path.getsize(splash_src_path) / 1024
            dst_kb = os.path.getsize(splash_dest_path) / 1024
            print(f"Optimized splash: {orig_w}x{orig_h} ({src_kb:.1f} KB) -> {target_w}x{target_h} WebP ({dst_kb:.1f} KB)")
        except Exception as e:
            print("Error optimizing splash screen:", str(e))

    # 2. Ensure master 1024x1024 icon is backed up in android-assets/icon.png
    if not os.path.exists(android_icon_path) and os.path.exists(public_icon_path):
        os.makedirs(os.path.dirname(android_icon_path), exist_ok=True)
        shutil.copy2(public_icon_path, android_icon_path)
        print(f"Backed up master icon from {public_icon_path} -> {android_icon_path}")

    source_icon_path = android_icon_path if os.path.exists(android_icon_path) else public_icon_path
    if not os.path.exists(source_icon_path):
        print(f"Info: No custom source icon at {source_icon_path}. Keeping existing launcher icons.")
        return False

    try:
        img = Image.open(source_icon_path)
        print(f"Loaded master source icon: {source_icon_path} ({img.width}x{img.height})")

        # Save resized/optimized 256x256 web icon to public/icon.png and public/assets/icon.png
        web_icon = img.resize((256, 256), resample_filter)
        os.makedirs(os.path.dirname(web_assets_path), exist_ok=True)
        web_icon.save(web_assets_path, "PNG", optimize=True)
        web_icon.save(public_icon_path, "PNG", optimize=True)
        web_kb = os.path.getsize(public_icon_path) / 1024
        print(f"Saved optimized 256x256 web icon to {public_icon_path} and {web_assets_path} ({web_kb:.1f} KB)")

        mipmaps = [
            ("mipmap-mdpi", 48, 108),
            ("mipmap-hdpi", 72, 162),
            ("mipmap-xhdpi", 96, 216),
            ("mipmap-xxhdpi", 144, 324),
            ("mipmap-xxxhdpi", 192, 432)
        ]

        for folder, launcher_size, foreground_size in mipmaps:
            folder_path = os.path.join(res_path, folder)
            if not os.path.exists(folder_path):
                continue

            launcher_img = img.resize((launcher_size, launcher_size), resample_filter)
            launcher_img.save(os.path.join(folder_path, "ic_launcher.png"), "PNG", optimize=True)

            round_img = img.resize((launcher_size, launcher_size), resample_filter)
            round_img.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG", optimize=True)

            fg_img = img.resize((foreground_size, foreground_size), resample_filter)
            fg_img.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG", optimize=True)

            print(f"Generated launcher icons for {folder} (Standard/Round: {launcher_size}px, Foreground: {foreground_size}px)")

        print("==============================================")
        print("  SUCCESS: ALL ICONS & SPLASH GENERATED!      ")
        print("==============================================")
        return True

    except Exception as e:
        print("Error compiling Android icons:", str(e))
        return False

if __name__ == "__main__":
    generate_icons()
