import 'dart:async';
import 'dart:ui';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

Future<void> main() async {
  // Ensure that plugin services are initialized so that `availableCameras()`
  // can be called before `runApp()`
  WidgetsFlutterBinding.ensureInitialized();

  // Obtain a list of the available cameras on the device.
  final cameras = await availableCameras();

  // Get a specific camera from the list of available cameras.
  final firstCamera = cameras[0];

  runApp(
    MaterialApp(
      theme: ThemeData.dark(),
      home: TakePictureScreen(
        // Pass the appropriate camera to the TakePictureScreen widget.
        camera: firstCamera,
      ),
    ),
  );
}

// A screen that allows users to take a picture using a given camera.
class TakePictureScreen extends StatefulWidget {
  const TakePictureScreen({super.key, required this.camera});

  final CameraDescription camera;

  @override
  TakePictureScreenState createState() => TakePictureScreenState();
}

class TakePictureScreenState extends State<TakePictureScreen>
    with WidgetsBindingObserver {
  CameraController? _controller;
  Future<void>? _initializeControllerFuture;
  bool _isDisposed = false;
  bool _isPressed = false;
  double _baseScale = 1.0;
  double _currentScale = 1.0;
  Offset? _focusPoint;
  double _focusScale = 0.0;
  bool _isFocusing = false;
  final TextRecognizer _textRecognizer = TextRecognizer();
  List<TextBlock> _detectedNumbers = [];
  Timer? _recognitionTimer;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    _textRecognizer.close();
    _recognitionTimer?.cancel();
    super.dispose();
  }

  Future<void> _processImage() async {
    if (_isDisposed || _isProcessing || _controller == null) {
      return;
    }
    _isProcessing = true;

    try {
      final XFile image = await _controller!.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      final numbers = recognizedText.blocks.where((block) {
        final text = block.text.trim().replaceAll(' ', '');
        return RegExp(r'^\d{4,5}$').hasMatch(text);
      }).toList();

      if (mounted && !_isDisposed) {
        setState(() {
          _detectedNumbers = numbers;
        });
      }

      // Delete the temporary image file
      final file = File(image.path);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e, stackTrace) {
      print('Error processing image: $e');
      print('Stack trace: $stackTrace');
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> _initializeCamera() async {
    if (_isDisposed) {
      return;
    }

    if (_controller?.value.isInitialized ?? false) {
      await _controller?.dispose();
    }

    _controller = CameraController(
      widget.camera,
      ResolutionPreset.high,
      enableAudio: false,
    );

    _initializeControllerFuture = _controller
        ?.initialize()
        .then((_) async {
          if (!_isDisposed && mounted) {
            await _controller?.setZoomLevel(1.0);
            await _controller?.setFlashMode(FlashMode.off);

            _recognitionTimer?.cancel();
            _recognitionTimer = Timer.periodic(const Duration(seconds: 1), (
              timer,
            ) {
              _processImage();
            });
            setState(() {});
          }
        })
        .catchError((error) {
          print('Error initializing camera: $error');
        });
  }

  Future<void> _setZoom(double zoom) async {
    if (_controller?.value.isInitialized ?? false) {
      await _controller?.setZoomLevel(zoom);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (state == AppLifecycleState.resumed) {
      await _initializeCamera();
    } else if (state == AppLifecycleState.inactive) {
      _recognitionTimer?.cancel();
      if (_controller?.value.isInitialized ?? false) {
        await _controller?.dispose();
      }
    }
  }

  Future<void> _handleFocus(Offset position) async {
    if (_isFocusing || _controller?.value.isInitialized != true || _isDisposed)
      return;

    _isFocusing = true;
    try {
      final CameraController cameraController = _controller!;
      final Size screenSize = MediaQuery.of(context).size;

      // Convert tap position to camera coordinates
      final double x = position.dx / screenSize.width;
      final double y = position.dy / screenSize.height;

      setState(() {
        _focusPoint = position;
        _focusScale = 0.0;
      });

      // Set both focus and exposure points
      await cameraController.setFocusPoint(Offset(x, y));
      await cameraController.setExposurePoint(Offset(x, y));
      await cameraController.setFocusMode(FocusMode.locked);
      await cameraController.setExposureMode(ExposureMode.auto);

      // Animate the focus scale
      if (mounted) {
        setState(() {
          _focusScale = 1.0;
        });
      }

      // Wait for animation to complete before clearing
      await Future.delayed(const Duration(milliseconds: 50));

      // After a delay, return to auto focus
      await Future.delayed(const Duration(seconds: 1));

      if (mounted && !_isDisposed) {
        await cameraController.setFocusMode(FocusMode.auto);
        if (mounted) {
          setState(() {
            _focusPoint = null;
            _focusScale = 0.0;
          });
        }
      }
    } catch (e) {
      print('Error setting focus: $e');
    } finally {
      _isFocusing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || _initializeControllerFuture == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('FTC Lens')),
      body: FutureBuilder<void>(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return Stack(
              children: [
                GestureDetector(
                  onScaleStart: (details) {
                    _baseScale = _currentScale;
                  },
                  onScaleUpdate: (details) {
                    _currentScale = (_baseScale * details.scale).clamp(
                      1.0,
                      8.0,
                    );
                    _setZoom(_currentScale);
                    setState(() {});
                  },
                  onTapUp: (details) {
                    _handleFocus(details.localPosition);
                  },
                  child: Stack(
                    children: [
                      CameraPreview(_controller!),
                      if (_focusPoint != null)
                        Positioned(
                          left: _focusPoint!.dx - 30,
                          top: _focusPoint!.dy - 30,
                          child: AnimatedScale(
                            duration: const Duration(milliseconds: 100),
                            scale: _focusScale,
                            child: Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                          ),
                        ),
                      ..._detectedNumbers.map((block) {
                        final rect = block.boundingBox;
                        // Scale the rectangle to match the preview size
                        final previewSize = MediaQuery.of(context).size;
                        final scaledRect = Rect.fromLTWH(
                          rect.left *
                              (previewSize.width /
                                  _controller!.value.previewSize!.width),
                          rect.top *
                              (previewSize.height /
                                  _controller!.value.previewSize!.height),
                          rect.width *
                              (previewSize.width /
                                  _controller!.value.previewSize!.width),
                          rect.height *
                              (previewSize.height /
                                  _controller!.value.previewSize!.height),
                        );
                        return Positioned(
                          left: scaledRect.left,
                          top: scaledRect.top,
                          child: Container(
                            width: scaledRect.width,
                            height: scaledRect.height,
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Center(
                              child: Text(
                                'XXXXX',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: _currentScale > 1.0
                        ? Text(
                            '${_currentScale.toStringAsFixed(1)}x',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                Shadow(
                                  offset: Offset(1, 1),
                                  blurRadius: 3.0,
                                  color: Colors.black,
                                ),
                              ],
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ),
                Positioned(
                  bottom: 30,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: SizedBox(
                      width: 70,
                      height: 70,
                      child: GestureDetector(
                        onTapDown: (_) {
                          setState(() {
                            _isPressed = true;
                          });
                        },
                        onTapUp: (_) {
                          setState(() {
                            _isPressed = false;
                          });
                          _takePicture();
                        },
                        onTapCancel: () {
                          setState(() {
                            _isPressed = false;
                          });
                        },
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            final center = constraints.maxWidth / 2;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 100),
                              transform: Matrix4.identity()
                                ..translate(center, center)
                                ..scale(_isPressed ? 0.9 : 1.0)
                                ..translate(-center, -center),
                              child: FloatingActionButton(
                                backgroundColor: _isPressed
                                    ? Colors.grey[300]
                                    : Colors.white,
                                shape: const CircleBorder(),
                                elevation: 4,
                                onPressed: null,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          } else {
            return const Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }

  Future<void> _takePicture() async {
    try {
      if (_controller == null) return;

      await _initializeControllerFuture;
      final cameraImage = await _controller!.takePicture();

      if (!context.mounted) return;

      // Create a custom painter to draw overlays
      final recorder = PictureRecorder();
      final canvas = Canvas(recorder);

      // Draw the camera image
      final imageBytes = await cameraImage.readAsBytes();
      final codec = await instantiateImageCodec(imageBytes);
      final frameInfo = await codec.getNextFrame();
      final capturedImage = frameInfo.image;

      // Use the actual image dimensions
      final imageSize = Size(
        capturedImage.width.toDouble(),
        capturedImage.height.toDouble(),
      );

      // Draw the image
      canvas.drawImage(capturedImage, Offset.zero, Paint());

      // Draw the number overlays
      for (var block in _detectedNumbers) {
        final rect = block.boundingBox;

        // Use the same positioning logic as the camera preview
        final paint = Paint()
          ..color = Colors.red
          ..style = PaintingStyle.fill;

        canvas.drawRect(
          Rect.fromLTWH(rect.left, rect.top, rect.width, rect.height),
          paint,
        );

        // Draw the text
        final textPainter = TextPainter(
          text: TextSpan(
            text: 'XXXXX',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        textPainter.layout();
        textPainter.paint(
          canvas,
          Offset(
            rect.left + (rect.width - textPainter.width) / 2,
            rect.top + (rect.height - textPainter.height) / 2,
          ),
        );
      }

      // Convert the canvas to an image using the actual image dimensions
      final picture = recorder.endRecording();
      final overlayImage = await picture.toImage(
        imageSize.width.toInt(),
        imageSize.height.toInt(),
      );
      final overlayBytes = await overlayImage.toByteData(
        format: ImageByteFormat.png,
      );

      if (overlayBytes != null) {
        // Save the combined image
        await Gal.putImageBytes(overlayBytes.buffer.asUint8List());

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Picture with overlays saved to gallery!'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      print(e);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving picture: $e'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }
}
