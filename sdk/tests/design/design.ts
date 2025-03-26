/* eslint-disable @typescript-eslint/no-loss-of-precision */

import type { GetFileResponse } from "@figma/rest-api-spec";

export default {
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "scrollBehavior": "SCROLLS",
    "children": [
      {
        "id": "0:1",
        "name": "Page with multiple frames",
        "type": "CANVAS",
        "scrollBehavior": "SCROLLS",
        "children": [
          {
            "id": "1:2",
            "name": "MyFrame",
            "type": "FRAME",
            "scrollBehavior": "SCROLLS",
            "children": [
              {
                "id": "1:3",
                "name": "Dummy Message",
                "type": "TEXT",
                "scrollBehavior": "SCROLLS",
                "blendMode": "PASS_THROUGH",
                "fills": [
                  {
                    "blendMode": "NORMAL",
                    "type": "SOLID",
                    "color": {
                      "r": 0,
                      "g": 0,
                      "b": 0,
                      "a": 1
                    }
                  }
                ],
                "fillGeometry": [],
                "strokes": [],
                "strokeWeight": 1,
                "strokeAlign": "OUTSIDE",
                "strokeGeometry": [],
                "absoluteBoundingBox": {
                  "x": 101,
                  "y": 142,
                  "width": 98,
                  "height": 15
                },
                "absoluteRenderBounds": {
                  "x": 102.05681610107422,
                  "y": 145.27272033691406,
                  "width": 95.86896514892578,
                  "height": 11.318191528320312
                },
                "constraints": {
                  "vertical": "TOP",
                  "horizontal": "LEFT"
                },
                "relativeTransform": [
                  [
                    1,
                    0,
                    101
                  ],
                  [
                    0,
                    1,
                    142
                  ]
                ],
                "size": {
                  "x": 98,
                  "y": 15
                },
                "characters": "Dummy Message",
                "characterStyleOverrides": [],
                "styleOverrideTable": {},
                "lineTypes": [
                  "NONE"
                ],
                "lineIndentations": [
                  0
                ],
                "style": {
                  "fontFamily": "Inter",
                  "fontPostScriptName": null,
                  "fontStyle": "Regular",
                  "fontWeight": 400,
                  "textAutoResize": "WIDTH_AND_HEIGHT",
                  "fontSize": 12,
                  "textAlignHorizontal": "LEFT",
                  "textAlignVertical": "TOP",
                  "letterSpacing": 0,
                  "lineHeightPx": 14.522727012634277,
                  "lineHeightPercent": 100,
                  "lineHeightUnit": "INTRINSIC_%"
                },
                "layoutVersion": 4,
                "effects": [],
                "interactions": []
              }
            ],
            "blendMode": "PASS_THROUGH",
            "clipsContent": true,
            "background": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 1,
                  "g": 1,
                  "b": 1,
                  "a": 1
                }
              }
            ],
            "fills": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 1,
                  "g": 1,
                  "b": 1,
                  "a": 1
                }
              }
            ],
            "strokes": [],
            "strokeWeight": 1,
            "strokeAlign": "INSIDE",
            "backgroundColor": {
              "r": 1,
              "g": 1,
              "b": 1,
              "a": 1
            },
            "fillGeometry": [
              {
                "path": "M0 0L300 0L300 300L0 300L0 0Z",
                "windingRule": "NONZERO"
              }
            ],
            "strokeGeometry": [],
            "absoluteBoundingBox": {
              "x": 0,
              "y": 0,
              "width": 300,
              "height": 300
            },
            "absoluteRenderBounds": {
              "x": 0,
              "y": 0,
              "width": 300,
              "height": 300
            },
            "constraints": {
              "vertical": "TOP",
              "horizontal": "LEFT"
            },
            "relativeTransform": [
              [
                1,
                0,
                0
              ],
              [
                0,
                1,
                0
              ]
            ],
            "size": {
              "x": 300,
              "y": 300
            },
            "effects": [],
            "interactions": []
          },
          {
            "id": "1:4",
            "name": "This Figma design is used for Anima SDK tests. See more on https://github.com/AnimaApp/anima-sdk/blob/main/DEVELOPMENT.md",
            "type": "TEXT",
            "scrollBehavior": "SCROLLS",
            "blendMode": "PASS_THROUGH",
            "fills": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 0,
                  "g": 0,
                  "b": 0,
                  "a": 1
                }
              }
            ],
            "fillGeometry": [],
            "strokes": [],
            "strokeWeight": 1,
            "strokeAlign": "OUTSIDE",
            "strokeGeometry": [],
            "absoluteBoundingBox": {
              "x": -230,
              "y": -102,
              "width": 839,
              "height": 53
            },
            "absoluteRenderBounds": {
              "x": -229.28977966308594,
              "y": -98.37641906738281,
              "width": 834.4939575195312,
              "height": 43.69459915161133
            },
            "constraints": {
              "vertical": "TOP",
              "horizontal": "LEFT"
            },
            "relativeTransform": [
              [
                1,
                0,
                -230
              ],
              [
                0,
                1,
                -102
              ]
            ],
            "size": {
              "x": 839,
              "y": 53
            },
            "characters": "This Figma design is used for Anima SDK tests.\nSee more on https://github.com/AnimaApp/anima-sdk/blob/main/DEVELOPMENT.md",
            "characterStyleOverrides": [],
            "styleOverrideTable": {},
            "lineTypes": [
              "NONE",
              "NONE"
            ],
            "lineIndentations": [
              0,
              0
            ],
            "style": {
              "fontFamily": "Inter",
              "fontPostScriptName": "Inter-Bold",
              "fontStyle": "Bold",
              "fontWeight": 700,
              "fontSize": 20,
              "textAlignHorizontal": "LEFT",
              "textAlignVertical": "TOP",
              "letterSpacing": 0,
              "lineHeightPx": 24.204544067382812,
              "lineHeightPercent": 100,
              "lineHeightUnit": "INTRINSIC_%"
            },
            "layoutVersion": 4,
            "effects": [],
            "interactions": []
          },
          {
            "id": "14:5",
            "name": "InvalidStarterNode",
            "type": "SECTION",
            "scrollBehavior": "SCROLLS",
            "children": [],
            "fills": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 1,
                  "g": 1,
                  "b": 1,
                  "a": 1
                }
              }
            ],
            "fillGeometry": [
              {
                "path": "M0 2C0 0.895429 0.895431 0 2 0L290 0C291.105 0 292 0.895431 292 2L292 65C292 66.1046 291.105 67 290 67L1.99999 67C0.895423 67 0 66.1046 0 65L0 2Z",
                "windingRule": "NONZERO"
              }
            ],
            "strokes": [
              {
                "opacity": 0.10000000149011612,
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 0,
                  "g": 0,
                  "b": 0,
                  "a": 1
                }
              }
            ],
            "strokeWeight": 1,
            "strokeAlign": "INSIDE",
            "strokeGeometry": [
              {
                "path": "M2 1L290 1L290 -1L2 -1L2 1ZM291 2L291 65L293 65L293 2L291 2ZM290 66L1.99999 66L1.99999 68L290 68L290 66ZM1 65L1 2L-1 2L-1 65L1 65ZM1.99999 66C1.44771 66 1 65.5523 1 65L-1 65C-1 66.6569 0.343133 68 1.99999 68L1.99999 66ZM291 65C291 65.5523 290.552 66 290 66L290 68C291.657 68 293 66.6569 293 65L291 65ZM290 1C290.552 1 291 1.44771 291 2L293 2C293 0.343151 291.657 -1 290 -1L290 1ZM2 -1C0.343147 -1 -1 0.343143 -1 2L1 2C1 1.44771 1.44771 1 2 1L2 -1Z",
                "windingRule": "NONZERO"
              }
            ],
            "absoluteBoundingBox": {
              "x": 8,
              "y": 359,
              "width": 292,
              "height": 67
            },
            "absoluteRenderBounds": {
              "x": 8,
              "y": 359,
              "width": 292,
              "height": 67
            },
            "relativeTransform": [
              [
                1,
                0,
                8
              ],
              [
                0,
                1,
                359
              ]
            ],
            "size": {
              "x": 292,
              "y": 67
            },
            "sectionContentsHidden": false
          },
          {
            "id": "134:14",
            "name": "InvisibleGroupNode",
            "visible": false,
            "type": "GROUP",
            "scrollBehavior": "SCROLLS",
            "children": [
              {
                "id": "134:15",
                "name": "Rectangle",
                "type": "RECTANGLE",
                "scrollBehavior": "SCROLLS",
                "blendMode": "PASS_THROUGH",
                "fills": [
                  {
                    "blendMode": "NORMAL",
                    "type": "SOLID",
                    "color": {
                      "r": 1,
                      "g": 0,
                      "b": 0,
                      "a": 1
                    }
                  }
                ],
                "fillGeometry": [
                  {
                    "path": "M0 19C0 8.50659 8.50659 0 19 0L145 0C155.493 0 164 8.50659 164 19L164 19C164 29.4934 155.493 38 145 38L19 38C8.50659 38 0 29.4934 0 19L0 19Z",
                    "windingRule": "NONZERO"
                  }
                ],
                "strokes": [],
                "strokeWeight": 1,
                "strokeAlign": "INSIDE",
                "strokeGeometry": [],
                "cornerRadius": 30,
                "cornerSmoothing": 0,
                "absoluteBoundingBox": {
                  "x": 200,
                  "y": 436,
                  "width": 164,
                  "height": 38
                },
                "absoluteRenderBounds": null,
                "constraints": {
                  "vertical": "SCALE",
                  "horizontal": "SCALE"
                },
                "relativeTransform": [
                  [
                    1,
                    0,
                    0
                  ],
                  [
                    0,
                    1,
                    0
                  ]
                ],
                "size": {
                  "x": 164,
                  "y": 38
                },
                "effects": [],
                "interactions": []
              }
            ],
            "blendMode": "PASS_THROUGH",
            "clipsContent": false,
            "background": [],
            "fills": [],
            "strokes": [],
            "cornerRadius": 30,
            "cornerSmoothing": 0,
            "strokeWeight": 1,
            "strokeAlign": "INSIDE",
            "backgroundColor": {
              "r": 0,
              "g": 0,
              "b": 0,
              "a": 0
            },
            "fillGeometry": [],
            "strokeGeometry": [],
            "absoluteBoundingBox": {
              "x": 200,
              "y": 436,
              "width": 164,
              "height": 38
            },
            "absoluteRenderBounds": null,
            "constraints": {
              "vertical": "TOP",
              "horizontal": "LEFT"
            },
            "relativeTransform": [
              [
                1,
                0,
                200
              ],
              [
                0,
                1,
                436
              ]
            ],
            "size": {
              "x": 164,
              "y": 38
            },
            "effects": [],
            "interactions": []
          },
          {
            "id": "134:20",
            "name": "Note for invisible node",
            "type": "TEXT",
            "scrollBehavior": "SCROLLS",
            "blendMode": "PASS_THROUGH",
            "fills": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 0,
                  "g": 0,
                  "b": 0,
                  "a": 1
                }
              }
            ],
            "fillGeometry": [],
            "strokes": [],
            "strokeWeight": 1,
            "strokeAlign": "OUTSIDE",
            "strokeGeometry": [],
            "absoluteBoundingBox": {
              "x": 8,
              "y": 444,
              "width": 182,
              "height": 22
            },
            "absoluteRenderBounds": {
              "x": 9.585227012634277,
              "y": 448.5,
              "width": 178.8989715576172,
              "height": 17.18182373046875
            },
            "constraints": {
              "vertical": "TOP",
              "horizontal": "LEFT"
            },
            "relativeTransform": [
              [
                1,
                0,
                8
              ],
              [
                0,
                1,
                444
              ]
            ],
            "size": {
              "x": 182,
              "y": 22
            },
            "characters": "Invisible Group Node:",
            "characterStyleOverrides": [],
            "styleOverrideTable": {},
            "lineTypes": [
              "NONE"
            ],
            "lineIndentations": [
              0
            ],
            "style": {
              "fontFamily": "Inter",
              "fontPostScriptName": null,
              "fontStyle": "Regular",
              "fontWeight": 400,
              "textAutoResize": "WIDTH_AND_HEIGHT",
              "fontSize": 18,
              "textAlignHorizontal": "LEFT",
              "textAlignVertical": "TOP",
              "letterSpacing": 0,
              "lineHeightPx": 21.784090042114258,
              "lineHeightPercent": 100,
              "lineHeightUnit": "INTRINSIC_%"
            },
            "layoutVersion": 4,
            "effects": [],
            "interactions": []
          }
        ],
        "backgroundColor": {
          "r": 0.9607843160629272,
          "g": 0.9607843160629272,
          "b": 0.9607843160629272,
          "a": 1
        },
        "prototypeStartNodeID": null,
        "flowStartingPoints": [],
        "prototypeDevice": {
          "type": "NONE",
          "rotation": "NONE"
        }
      },
      {
        "id": "162:21",
        "name": "Page with a single frame",
        "type": "CANVAS",
        "scrollBehavior": "SCROLLS",
        "children": [
          {
            "id": "162:23",
            "name": "MyFrame",
            "type": "FRAME",
            "scrollBehavior": "SCROLLS",
            "children": [
              {
                "id": "162:24",
                "name": "Dummy Message",
                "type": "TEXT",
                "scrollBehavior": "SCROLLS",
                "blendMode": "PASS_THROUGH",
                "fills": [
                  {
                    "blendMode": "NORMAL",
                    "type": "SOLID",
                    "color": {
                      "r": 0,
                      "g": 0,
                      "b": 0,
                      "a": 1
                    }
                  }
                ],
                "fillGeometry": [],
                "strokes": [],
                "strokeWeight": 1,
                "strokeAlign": "OUTSIDE",
                "strokeGeometry": [],
                "absoluteBoundingBox": {
                  "x": 101,
                  "y": 142,
                  "width": 98,
                  "height": 15
                },
                "absoluteRenderBounds": {
                  "x": 102.05681610107422,
                  "y": 145.27272033691406,
                  "width": 95.86896514892578,
                  "height": 11.318191528320312
                },
                "constraints": {
                  "vertical": "TOP",
                  "horizontal": "LEFT"
                },
                "relativeTransform": [
                  [
                    1,
                    0,
                    101
                  ],
                  [
                    0,
                    1,
                    142
                  ]
                ],
                "size": {
                  "x": 98,
                  "y": 15
                },
                "characters": "Dummy Message",
                "characterStyleOverrides": [],
                "styleOverrideTable": {},
                "lineTypes": [
                  "NONE"
                ],
                "lineIndentations": [
                  0
                ],
                "style": {
                  "fontFamily": "Inter",
                  "fontPostScriptName": null,
                  "fontStyle": "Regular",
                  "fontWeight": 400,
                  "textAutoResize": "WIDTH_AND_HEIGHT",
                  "fontSize": 12,
                  "textAlignHorizontal": "LEFT",
                  "textAlignVertical": "TOP",
                  "letterSpacing": 0,
                  "lineHeightPx": 14.522727012634277,
                  "lineHeightPercent": 100,
                  "lineHeightUnit": "INTRINSIC_%"
                },
                "layoutVersion": 4,
                "effects": [],
                "interactions": []
              }
            ],
            "blendMode": "PASS_THROUGH",
            "clipsContent": true,
            "background": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 1,
                  "g": 1,
                  "b": 1,
                  "a": 1
                }
              }
            ],
            "fills": [
              {
                "blendMode": "NORMAL",
                "type": "SOLID",
                "color": {
                  "r": 1,
                  "g": 1,
                  "b": 1,
                  "a": 1
                }
              }
            ],
            "strokes": [],
            "strokeWeight": 1,
            "strokeAlign": "INSIDE",
            "backgroundColor": {
              "r": 1,
              "g": 1,
              "b": 1,
              "a": 1
            },
            "fillGeometry": [
              {
                "path": "M0 0L300 0L300 300L0 300L0 0Z",
                "windingRule": "NONZERO"
              }
            ],
            "strokeGeometry": [],
            "absoluteBoundingBox": {
              "x": 0,
              "y": 0,
              "width": 300,
              "height": 300
            },
            "absoluteRenderBounds": {
              "x": 0,
              "y": 0,
              "width": 300,
              "height": 300
            },
            "constraints": {
              "vertical": "TOP",
              "horizontal": "LEFT"
            },
            "relativeTransform": [
              [
                1,
                0,
                0
              ],
              [
                0,
                1,
                0
              ]
            ],
            "size": {
              "x": 300,
              "y": 300
            },
            "effects": [],
            "interactions": []
          }
        ],
        "backgroundColor": {
          "r": 0.9607843160629272,
          "g": 0.9607843160629272,
          "b": 0.9607843160629272,
          "a": 1
        },
        "prototypeStartNodeID": null,
        "flowStartingPoints": [],
        "prototypeDevice": {
          "type": "NONE",
          "rotation": "NONE"
        }
      }
    ]
  },
  "components": {},
  "componentSets": {},
  "schemaVersion": 0,
  "styles": {},
  "name": "Anima SDK - Test File",
  "lastModified": "2025-03-25T11:23:36Z",
  "thumbnailUrl": "https://s3-alpha.figma.com/thumbnails/5183095e-6741-4cd9-bb4f-f9a716539c93?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCT3MRUCDU%2F20250323%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250323T120000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=23506f44b297cc21ec4f3b4a7cd6605e209bf69ae8a9dd3ce65593b4580f0e47",
  "version": "2199410876928073277",
  "role": "owner",
  "editorType": "figma",
  "linkAccess": "view"
} satisfies GetFileResponse;