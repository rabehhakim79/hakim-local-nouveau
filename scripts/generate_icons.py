import zlib
import struct
import math

def create_png(width, height, get_pixel, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        crc = struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c + crc

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(raw_data))) + chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename}")

def draw_pos_icon(is_maskable=False):
    def pixel(x, y, w, h):
        nx = x / w
        ny = y / h
        
        # Outer background
        if is_maskable:
            # Full bleed background for maskable icon
            bg_r, bg_g, bg_b = int(37 + (29 - 37) * ny), int(99 + (78 - 99) * ny), int(235 + (216 - 235) * ny)
            bg_a = 255
        else:
            # Rounded squircle
            corner_r = 0.22
            dx = max(0.0, abs(nx - 0.5) - (0.5 - corner_r))
            dy = max(0.0, abs(ny - 0.5) - (0.5 - corner_r))
            dist = math.sqrt(dx*dx + dy*dy)
            if dist > corner_r:
                return (0, 0, 0, 0)
            
            bg_r = int(37 + (29 - 37) * ny)
            bg_g = int(99 + (78 - 99) * ny)
            bg_b = int(235 + (216 - 235) * ny)
            bg_a = 255

        # Content in safe area (0.2 to 0.8)
        # Stand at bottom
        if 0.42 <= nx <= 0.58 and 0.72 <= ny <= 0.80:
            return (148, 163, 184, 255)
        if 0.35 <= nx <= 0.65 and 0.80 <= ny <= 0.84:
            return (100, 116, 139, 255)

        # Monitor Outer Border
        if 0.20 <= nx <= 0.80 and 0.22 <= ny <= 0.72:
            # Monitor Bezel
            if nx < 0.24 or nx > 0.76 or ny < 0.26 or ny > 0.68:
                return (15, 23, 42, 255)
            
            # Screen Interior
            if 0.24 <= nx <= 0.76 and 0.26 <= ny <= 0.68:
                # Top header bar on screen
                if 0.28 <= ny <= 0.34:
                    if 0.27 <= nx <= 0.30:
                        return (56, 189, 248, 255) # cyan dot
                    if 0.32 <= nx <= 0.35:
                        return (96, 165, 250, 255) # blue dot
                    return (30, 58, 138, 255) # header bar

                # POS Cart/Items table
                if 0.38 <= ny <= 0.54 and 0.27 <= nx <= 0.50:
                    if 0.40 <= ny <= 0.43 and 0.30 <= nx <= 0.47:
                        return (16, 185, 129, 255) # green line
                    if 0.46 <= ny <= 0.49 and 0.30 <= nx <= 0.44:
                        return (56, 189, 248, 255) # cyan line
                    return (30, 41, 59, 255) # cart box

                # Keypad / POS checkout
                if 0.38 <= ny <= 0.54 and 0.54 <= nx <= 0.73:
                    # keypad dots
                    if (ny - 0.43)**2 + (nx - 0.60)**2 < 0.0006:
                        return (56, 189, 248, 255)
                    if (ny - 0.43)**2 + (nx - 0.67)**2 < 0.0006:
                        return (56, 189, 248, 255)
                    if (ny - 0.50)**2 + (nx - 0.635)**2 < 0.0006:
                        return (16, 185, 129, 255)
                    return (30, 41, 59, 255)

                # Total bottom bar (Green Success)
                if 0.58 <= ny <= 0.64 and 0.27 <= nx <= 0.73:
                    return (16, 185, 129, 255)

                # Screen Background
                return (15, 23, 42, 255)

        return (bg_r, bg_g, bg_b, bg_a)

    return pixel

create_png(192, 192, draw_pos_icon(is_maskable=False), "public/pwa-192x192.png")
create_png(512, 512, draw_pos_icon(is_maskable=False), "public/pwa-512x512.png")
create_png(512, 512, draw_pos_icon(is_maskable=True), "public/pwa-maskable-512x512.png")
create_png(180, 180, draw_pos_icon(is_maskable=False), "public/apple-touch-icon.png")
create_png(64, 64, draw_pos_icon(is_maskable=False), "public/favicon.ico")
print("All icons generated successfully!")
