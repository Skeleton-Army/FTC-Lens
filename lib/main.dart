import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';

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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    if (_isDisposed) return;

    // Dispose of the previous controller if it exists
    if (_controller?.value.isInitialized ?? false) {
      await _controller?.dispose();
    }

    // Create a new controller
    _controller = CameraController(
      widget.camera,
      ResolutionPreset.max,
      enableAudio: false,
    );

    // Initialize the controller
    _initializeControllerFuture = _controller?.initialize().then((_) async {
      if (!_isDisposed && mounted) {
        // Set initial zoom level
        await _controller?.setZoomLevel(1.0);
        setState(() {});
      }
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
      // Reinitialize the camera when the app is resumed
      await _initializeCamera();
    } else if (state == AppLifecycleState.inactive) {
      // Dispose the camera when the app is inactive
      if (_controller?.value.isInitialized ?? false) {
        await _controller?.dispose();
      }
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
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
                  child: CameraPreview(_controller!),
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
                                backgroundColor: Colors.white,
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
      final image = await _controller!.takePicture();

      if (!context.mounted) return;

      await Gal.putImage(image.path);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Picture saved to gallery!'),
          duration: Duration(seconds: 2),
        ),
      );
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
