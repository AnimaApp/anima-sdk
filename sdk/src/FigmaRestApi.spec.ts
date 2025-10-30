import { describe, expect, it, vi } from "vitest";
import type {
  GetImageFillsResponse,
  GetImagesResponse,
} from "@figma/rest-api-spec";
import { FigmaRestApi } from "./FigmaRestApi";
import design from "../tests/design/design";

describe("# FigmaRestApi", () => {
  describe(".constructor", () => {
    describe("when the figma token starts with 'figd_'", () => {
      it("includes the token on the header as an 'X-FIGMA-TOKEN'", () => {
        const figmaRestApi = new FigmaRestApi({
          defaultOptions: {
            token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        });

        const headers = figmaRestApi.getHeaders();

        expect(headers["X-FIGMA-TOKEN"]).toBe(
          "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        );
      });
    });

    describe("when the figma token starts with 'figu_'", () => {
      it("includes the token on the header as an 'Authorization' bearer token", () => {
        const figmaRestApi = new FigmaRestApi({
          defaultOptions: {
            token: "figu_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
          },
        });

        const headers = figmaRestApi.getHeaders();

        expect(headers["Authorization"]).toBe(
          "Bearer figu_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
        );
      });
    });

    describe("when the figma token is invalid", () => {
      it("throws an InvalidFigmaAccessTokenError", () => {
        expect(() => {
          new FigmaRestApi({
            defaultOptions: {
              token: "invalid_toke",
            },
          });
        }).toThrowError("Invalid Figma Access Token");
      });
    });
  });

  describe(".updateDefaultOptions", () => {
    it("updates the default options", async () => {
      // Arrange
      const successResponse = new Response(JSON.stringify(design), {
        status: 200,
      });
      const successResponse2 = new Response(JSON.stringify(design), {
        status: 200,
      });
      const fetchMock = vi
        .fn()
        .mockReturnValueOnce(successResponse)
        .mockReturnValueOnce(successResponse2);

      const figmaRestApi = new FigmaRestApi({
        fetch: fetchMock,
        defaultOptions: {
          token: "figd_initialTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
      });

      // Act
      figmaRestApi.updateDefaultOptions({
        token: "figd_updatedTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      });

      await figmaRestApi.getFile({
        fileKey: "dummyFileKeyxxxxxxxxxx",
        nodeIds: ["1:2", "1:4"],
      });

      await figmaRestApi.getFile({
        fileKey: "dummyFileKeyxxxxxxxxxx",
        nodeIds: ["1:2", "1:4"],
      });

      // Assert
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_updatedTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_updatedTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );
    });
  });

  describe(".withOptions", () => {
    it("overrides the default options for the next request", async () => {
      // Arrange
      const successResponse = new Response(JSON.stringify(design), {
        status: 200,
      });
      const fetchMock = vi.fn().mockReturnValue(successResponse);

      const figmaRestApi = new FigmaRestApi({
        fetch: fetchMock,
        defaultOptions: {
          token: "figd_defaultTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
      });

      // Act
      await figmaRestApi
        .withOptions({
          token: "figd_overriddenTokenxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        })
        .getFile({
          fileKey: "dummyFileKeyxxxxxxxxxx",
          nodeIds: ["1:2", "1:4"],
        });

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_overriddenTokenxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );
    });

    it("resets to the default options after a request", async () => {
      // Arrange
      const successResponse = new Response(JSON.stringify(design), {
        status: 200,
      });
      const successResponse2 = new Response(JSON.stringify(design), {
        status: 200,
      });
      const fetchMock = vi
        .fn()
        .mockReturnValueOnce(successResponse)
        .mockReturnValueOnce(successResponse2);

      const figmaRestApi = new FigmaRestApi({
        fetch: fetchMock,
        defaultOptions: {
          token: "figd_defaultTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
      });

      // Act
      await figmaRestApi
        .withOptions({
          token: "figd_overriddenTokenxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        })
        .getFile({
          fileKey: "dummyFileKeyxxxxxxxxxx",
          nodeIds: ["1:2", "1:4"],
        });

      await figmaRestApi.getFile({
        fileKey: "dummyFileKeyxxxxxxxxxx",
        nodeIds: ["1:2", "1:4"],
      });

      // Assert
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_overriddenTokenxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_defaultTokenxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );
    });
  });

  describe(".getFile", () => {
    describe("when successful", () => {
      it("is called with the expected parameters and returns the file data", async () => {
        // Arrange
        const successResponse = new Response(JSON.stringify(design), {
          status: 200,
        });
        const fetchMock = vi.fn().mockReturnValue(successResponse);

        const figmaRestApi = new FigmaRestApi({
          fetch: fetchMock,
          defaultOptions: {
            token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        });

        // Act
        const fileData = await figmaRestApi.getFile({
          fileKey: "dummyFileKeyxxxxxxxxxx",
          nodeIds: ["1:2", "1:4"],
        });

        // Assert
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "X-FIGMA-TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            }),
          })
        );
        expect(fileData).toBeDefined();
        expect(fileData.name).toBe("Anima SDK - Test File");
      });
    });

    describe("when failed", () => {
      describe("when no Figma token is provided", () => {
        it("throws a MissingFigmaToken error", async () => {
          // Arrange
          const fetchMock = vi.fn();
          const figmaRestApi = new FigmaRestApi({
            fetch: fetchMock,
          });

          // Act & Assert
          await expect(
            figmaRestApi.getFile({
              fileKey: "dummyFileKeyxxxxxxxxxx",
              nodeIds: ["1:2", "1:4"],
            })
          ).rejects.toThrowError("Missing Figma Token");

          expect(fetchMock).toHaveBeenCalledTimes(0);
        });
      });

      describe("when the response is a 429", () => {
        describe("and the onRateLimited option is defined", () => {
          describe("and it returns true", () => {
            it("retries after the time", async () => {
              // Arrange
              vi.useFakeTimers();

              const rateLimitResponse = new Response(
                JSON.stringify({ status: 429, err: "Rate limit exceeded" }),
                {
                  status: 429,
                  headers: {
                    "Retry-After": "60",
                    "X-Figma-Plan-Tier": "org",
                    "X-Figma-Rate-Limit-Type": "low",
                    "X-Figma-Upgrade-Link":
                      "https://www.figma.com/files?api_paywall=true",
                  },
                }
              );
              const successResponse = new Response(JSON.stringify(design), {
                status: 200,
              });
              const fetchMock = vi
                .fn()
                .mockReturnValueOnce(rateLimitResponse)
                .mockReturnValueOnce(successResponse);

              const figmaRestApi = new FigmaRestApi({
                fetch: fetchMock,
                defaultOptions: {
                  token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                },
              });

              // Act
              let receivedRetryAfter: number | undefined;
              const fileDataPromise = figmaRestApi
                .withOptions({
                  async onRateLimited({ retryAfter }) {
                    receivedRetryAfter = retryAfter;
                    return true;
                  },
                })
                .getFile({
                  fileKey: "dummyFileKeyxxxxxxxxxx",
                  nodeIds: ["1:2", "1:4"],
                });

              await vi.advanceTimersByTimeAsync(61_000);

              const fileData = await fileDataPromise;

              // Assert
              expect(receivedRetryAfter).toBe(60);
              expect(fetchMock).toHaveBeenCalledTimes(2);
              expect(fetchMock).toHaveBeenCalledWith(
                "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
                expect.objectContaining({
                  method: "GET",
                  headers: expect.objectContaining({
                    "X-FIGMA-TOKEN":
                      "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  }),
                })
              );
              expect(fileData).toBeDefined();
              expect(fileData.name).toBe("Anima SDK - Test File");

              // Cleanup
              vi.useRealTimers();
            });

            describe("but received an abort signal while waiting", () => {
              it('throws an "AbortError" error', async () => {
                // Arrange
                vi.useFakeTimers();

                const rateLimitResponse = new Response(
                  JSON.stringify({ status: 429, err: "Rate limit exceeded" }),
                  {
                    status: 429,
                    headers: {
                      "Retry-After": "60",
                      "X-Figma-Plan-Tier": "org",
                      "X-Figma-Rate-Limit-Type": "low",
                      "X-Figma-Upgrade-Link":
                        "https://www.figma.com/files?api_paywall=true",
                    },
                  }
                );
                const fetchMock = vi
                  .fn()
                  .mockReturnValueOnce(rateLimitResponse);

                const figmaRestApi = new FigmaRestApi({
                  fetch: fetchMock,
                  defaultOptions: {
                    token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  },
                });

                const abortController = new AbortController();

                // Act
                const fileDataPromise = figmaRestApi
                  .withOptions({
                    abortSignal: abortController.signal,
                    async onRateLimited() {
                      return true;
                    },
                  })
                  .getFile({
                    fileKey: "dummyFileKeyxxxxxxxxxx",
                    nodeIds: ["1:2", "1:4"],
                  });

                await vi.advanceTimersByTimeAsync(20_000);

                abortController.abort();

                // Assert
                await expect(fileDataPromise).rejects.toThrowError(
                  "The operation was aborted."
                );
                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(fetchMock).toHaveBeenCalledWith(
                  "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
                  expect.objectContaining({
                    method: "GET",
                    headers: expect.objectContaining({
                      "X-FIGMA-TOKEN":
                        "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    }),
                  })
                );

                await vi.advanceTimersByTimeAsync(60_000);

                expect(fetchMock).toHaveBeenCalledTimes(1);

                // Cleanup
                vi.useRealTimers();
              });
            });
          });

          describe("and it returns false", () => {
            it("throws a RateLimitExceeded error", async () => {
              // Arrange
              vi.useFakeTimers();

              const rateLimitResponse = new Response(
                JSON.stringify({ status: 429, err: "Rate limit exceeded" }),
                {
                  status: 429,
                  headers: {
                    "Retry-After": "3600",
                    "X-Figma-Plan-Tier": "org",
                    "X-Figma-Rate-Limit-Type": "low",
                    "X-Figma-Upgrade-Link":
                      "https://www.figma.com/files?api_paywall=true",
                  },
                }
              );
              const fetchMock = vi.fn().mockReturnValueOnce(rateLimitResponse);

              const figmaRestApi = new FigmaRestApi({
                fetch: fetchMock,
                defaultOptions: {
                  token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                },
              });

              // Act & Assert
              let receivedRetryAfter: number | undefined;
              await expect(
                figmaRestApi
                  .withOptions({
                    async onRateLimited({ retryAfter }) {
                      receivedRetryAfter = retryAfter;
                      return false;
                    },
                  })
                  .getFile({
                    fileKey: "dummyFileKeyxxxxxxxxxx",
                    nodeIds: ["1:2", "1:4"],
                  })
              ).rejects.toThrowError("Rate Limit Exceeded");

              expect(receivedRetryAfter).toBe(3600);
              expect(fetchMock).toHaveBeenCalledTimes(1);
              expect(fetchMock).toHaveBeenCalledWith(
                "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
                expect.objectContaining({
                  method: "GET",
                  headers: expect.objectContaining({
                    "X-FIGMA-TOKEN":
                      "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  }),
                })
              );
            });
          });
        });

        describe("and the onRateLimited option is not defined", () => {
          it("throws a RateLimitExceeded error immediately", async () => {
            // Arrange
            vi.useFakeTimers();

            const rateLimitResponse = new Response(
              JSON.stringify({ status: 429, err: "Rate limit exceeded" }),
              {
                status: 429,
                headers: {
                  "Retry-After": "3600",
                  "X-Figma-Plan-Tier": "org",
                  "X-Figma-Rate-Limit-Type": "low",
                  "X-Figma-Upgrade-Link":
                    "https://www.figma.com/files?api_paywall=true",
                },
              }
            );
            const fetchMock = vi.fn().mockReturnValueOnce(rateLimitResponse);

            const figmaRestApi = new FigmaRestApi({
              fetch: fetchMock,
              defaultOptions: {
                token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              },
            });

            // Act & Assert
            await expect(
              figmaRestApi.getFile({
                fileKey: "dummyFileKeyxxxxxxxxxx",
                nodeIds: ["1:2", "1:4"],
              })
            ).rejects.toThrowError("Rate Limit Exceeded");

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(
              "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx?plugin_data=857346721138427857&geometry=paths&ids=1%3A2%2C1%3A4",
              expect.objectContaining({
                method: "GET",
                headers: expect.objectContaining({
                  "X-FIGMA-TOKEN":
                    "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                }),
              })
            );
          });
        });
      });
    });
  });

  describe(".getNodeImages", () => {
    describe('when called with the parameter "as" using "links"', () => {
      it("returns the images links", async () => {
        // Arrange
        const imagesResponseData: GetImagesResponse = {
          err: null,
          images: {
            "1:2": "https://example.com/image1.png",
            "1:3": null,
          },
        };
        const successResponse = new Response(
          JSON.stringify(imagesResponseData),
          {
            status: 200,
          }
        );
        const fetchMock = vi.fn().mockReturnValue(successResponse);

        const figmaRestApi = new FigmaRestApi({
          fetch: fetchMock,
          defaultOptions: {
            token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        });

        // Act
        const result = await figmaRestApi.getNodeImages({
          fileKey: "dummyFileKeyxxxxxxxxxx",
          nodeIds: ["1:2", "1:3"],
          as: "links",
        });

        // Assert
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          "https://api.figma.com/v1/images/dummyFileKeyxxxxxxxxxx?ids=1:2,1:3&format=jpg&scale=1",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "X-FIGMA-TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            }),
          })
        );
        expect(result).toStrictEqual({
          "1:2": "https://example.com/image1.png",
          "1:3": null,
        });
      });
    });

    describe('when called with the parameter "as" using "arrayBuffer"', () => {
      it("returns the images as ArrayBuffers", async () => {
        // Arrange
        const imagesResponseData: GetImagesResponse = {
          err: null,
          images: {
            "1:2": "https://example.com/success.png",
            "1:3": "https://example.com/fail.png",
            "1:4": null,
          },
        };
        const successResponse = new Response(
          JSON.stringify(imagesResponseData),
          {
            status: 200,
          }
        );

        const image1ArrayBuffer = new Uint8Array([137, 80, 78, 71]).buffer; // PNG file signature

        const fetchMock = vi
          .fn()
          .mockReturnValueOnce(successResponse) // First call to get image URLs
          .mockReturnValueOnce(new Response(image1ArrayBuffer, { status: 200 })) // Second call to download success.png
          .mockReturnValueOnce(new Response(null, { status: 404 })); // Third call to download fail.png

        const figmaRestApi = new FigmaRestApi({
          fetch: fetchMock,
          defaultOptions: {
            token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        });

        // Act
        const result = await figmaRestApi.getNodeImages({
          fileKey: "dummyFileKeyxxxxxxxxxx",
          nodeIds: ["1:2", "1:3", "1:4"],
          as: "arrayBuffer",
        });

        // Assert
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(
          1,
          "https://api.figma.com/v1/images/dummyFileKeyxxxxxxxxxx?ids=1:2,1:3,1:4&format=jpg&scale=1",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "X-FIGMA-TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            }),
          })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
          2,
          "https://example.com/success.png"
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
          3,
          "https://example.com/fail.png"
        );
        expect(result).toStrictEqual({
          "1:2": image1ArrayBuffer,
          "1:3": null,
          "1:4": null,
        });
      });
    });

    describe("and it fails", () => {
      it("throws the wrapped Figma API error", async () => {
        // Arrange
        const errorResponse = new Response(
          JSON.stringify({ status: 403, err: "Forbidden" }),
          {
            status: 403,
          }
        );
        const fetchMock = vi.fn().mockReturnValue(errorResponse);

        const figmaRestApi = new FigmaRestApi({
          fetch: fetchMock,
          defaultOptions: {
            token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        });

        // Act & Assert
        await expect(
          figmaRestApi.getNodeImages({
            fileKey: "dummyFileKeyxxxxxxxxxx",
            nodeIds: ["1:2", "1:3"],
          })
        ).rejects.toThrowError("Token Issue");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          "https://api.figma.com/v1/images/dummyFileKeyxxxxxxxxxx?ids=1:2,1:3&format=jpg&scale=1",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "X-FIGMA-TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            }),
          })
        );
      });
    });
  });

  describe(".getImagesFill", () => {
    it("returns the images fill data", async () => {
      // Arrange
      const imagesResponseData: GetImageFillsResponse = {
        error: false,
        status: 200,
        meta: {
          images: {
            "1:2": "https://example.com/image1.png",
            "1:3": "https://example.com/image2.png",
          },
        },
      };
      const successResponse = new Response(JSON.stringify(imagesResponseData), {
        status: 200,
      });
      const fetchMock = vi.fn().mockReturnValue(successResponse);

      const figmaRestApi = new FigmaRestApi({
        fetch: fetchMock,
        defaultOptions: {
          token: "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
      });

      // Act
      const result = await figmaRestApi.getImageFills({
        fileKey: "dummyFileKeyxxxxxxxxxx",
      });

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.figma.com/v1/files/dummyFileKeyxxxxxxxxxx/images",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-FIGMA-TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          }),
        })
      );
      expect(result).toStrictEqual({
        "1:2": "https://example.com/image1.png",
        "1:3": "https://example.com/image2.png",
      });
    });
  });
});
