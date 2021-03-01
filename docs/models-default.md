# Models available online or embedded in PiGallery

```json
{
  "classify": [
    { "name": "MobileNet v3",
      "modelPath": "https://storage.googleapis.com/tfhub-tfjs-modules/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/classification/5/default/1/model.json",
      "classes": "assets/classes-imagenet.json",
      "offset": 1, "tensorSize": 224
    }
  ],
  "detect": [
    { "name": "COCO SSD MobileNet v2",
      "modelPath": "https://storage.googleapis.com/tfhub-tfjs-modules/tensorflow/tfjs-model/ssd_mobilenet_v1/1/default/1/model.json",
      "classes": "assets/classes-coco.json",
      "minScore":0.3, "scaleOutput":true, "maxResults":20, "offset": 1,
      "map": { "boxes": "Postprocessor/ExpandDims_1", "scores": "Postprocessor/Slice", "classes": null }
    }
 ],
 "person": { "name": "Human",
  "videoOptimized": false, "filter": { "enabled": false }, "gesture": { "enabled": false }, "body": { "enabled": false }, "hand": { "enabled": false },
  "face": {
    "detector": { "modelPath": "@vladmandic/human/models/blazeface-back.json", "rotation": true },
    "mesh": { "modelPath": "@vladmandic/human/models/facemesh.json" },
    "iris": { "modelPath": "@vladmandic/human/models/iris.json" },
    "age": { "modelPath": "@vladmandic/human/models/age-ssrnet-imdb.json" },
    "gender": { "modelPath": "@vladmandic/human/models/gender.json" },
    "emotion": { "modelPath": "@vladmandic/human/models/emotion-large.json" },
    "embedding": { "modelPath": "@vladmandic/human/models/mobilefacenet.json", "enabled": true }
  } },
"video": [],
  "various": []
}
```