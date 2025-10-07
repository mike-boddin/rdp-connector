FROM ubuntu:22.04

ENV OPT_FUSE_DEFAULT=ON
ENV DEBIAN_FRONTEND=noninteractive
ENV FREERDP_VERSION=3.17.2

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    git \
    pkg-config

RUN apt-get install -y \
    libssl-dev \
    libx11-dev \
    libxext-dev \
    libxinerama-dev \
    libxcursor-dev \
    libxdamage-dev \
    libxv-dev \
    libxkbfile-dev \
    libxrandr-dev \
    libxi-dev \
    libxss-dev \
    libfuse3-dev

RUN apt-get install -y \
    libasound2-dev \
    libpulse-dev \
    libavutil-dev \
    libavcodec-dev \
    libswscale-dev \
    libavformat-dev \
    libjpeg-dev \
    libturbojpeg0-dev \
    libopenh264-dev

RUN apt-get install -y \
    libcups2-dev \
    libxml2-dev \
    libkrb5-dev \
    libgssapi-krb5-2 \
    libusb-1.0-0-dev \
    libudev-dev \
    libdbus-glib-1-dev \
    uuid-dev \
    libffi-dev

RUN apt-get install -y \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-good1.0-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    libgdk-pixbuf2.0-dev

RUN apt-get install -y \
    libgtk-3-dev \
    || echo "GTK3 installation failed, continuing without WebView support"

RUN apt-get install -y \
    libwebkit2gtk-4.0-dev \
    || echo "WebKit installation failed, continuing without WebView support"

RUN apt-get install -y \
    libwayland-dev \
    libxkbcommon-dev

RUN apt-get install -y \
         dpkg-dev \
         libxrender-dev \
         libxfixes-dev \
         libxtst-dev \
         libswresample-dev \
         libcjson-dev \
         patchelf \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /build

RUN git clone https://github.com/freerdp/freerdp.git --branch $FREERDP_VERSION --single-branch && mkdir freerdp-build

RUN cmake -GNinja \
    -B freerdp-build \
    -S freerdp \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=TRUE \
    -DBUILD_SHARED_LIBS=OFF \
    -DCMAKE_SKIP_INSTALL_ALL_DEPENDENCY=OFF \
    -DCMAKE_INSTALL_PREFIX=/opt \
    -DCMAKE_INSTALL_RPATH='$ORIGIN/../lib' \
    -DWITH_SERVER=ON \
    -DWITH_SAMPLE=ON \
    -DWITH_PLATFORM_SERVER=OFF \
    -DUSE_UNWIND=OFF \
    -DWITH_VERBOSE_WINPR_ASSERT=OFF \
    -DWITH_SWSCALE=OFF \
    -DWITH_FFMPEG=ON \
    -DWITH_WEBVIEW=ON \
    -DWITH_OPENH264=ON \
    -DWITH_FFMPEG=ON \
    -DWITH_GFX_H264=ON \
    -DWITH_AAD=ON \
    -DWITH_WINPR_JSON=ON \
    -DWITH_JPEG=ON \
    -DWITH_VAAPI=ON \
    -DWITH_SWSCALE=ON \
    -DWITH_GDI=ON \
    -DWITH_SSE2=ON \
    -DWITH_AVX2=ON \
    -DWITH_UDP=ON

RUN cmake --build freerdp-build && \
    cmake --install freerdp-build

COPY bundle.sh /build/

RUN chmod +x /build/bundle.sh && /build/bundle.sh

RUN patchelf --set-rpath '$ORIGIN/../lib' /opt/bin/xfreerdp

RUN rm -rf /build

WORKDIR /

CMD ["/bin/bash"]