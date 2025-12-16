import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { UserInfo, ImageStyle } from "../types";
import { generateImageFromText } from "../services/api";
import { detectPlatform } from "../utils/platform";

export default function Step3Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = location.state?.userInfo as UserInfo;
  const introduction = location.state?.introduction as string;
  const selectedStyle = location.state?.selectedStyle as ImageStyle | null;
  const captureRef = useRef<HTMLDivElement>(null);
  const hasGeneratedRef = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 컨텐츠 종료 메시지 전송
  useEffect(() => {
    //console.error('컨텐츠 마지막 페이지 확인!! ');
    // 컨텐츠의 마지막 페이지에서 실행
    // 보안: '*' 대신 현재 origin 또는 부모 origin 사용
    const targetOrigin = window.location.origin || "*";
    window.parent.postMessage(
      {
        op: "contentFinished",
        data: {},
        from: "child",
      },
      targetOrigin
    );
  }, []);

  // 컴포넌트 마운트 시 선택된 스타일로 이미지 생성
  useEffect(() => {
    // 이미 생성했으면 실행하지 않음
    if (hasGeneratedRef.current) {
      return;
    }

    const createImage = async () => {
      if (!introduction || !selectedStyle) {
        setError("자기소개 텍스트 또는 스타일이 없습니다.");
        return;
      }

      hasGeneratedRef.current = true;
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateImageFromText(introduction, selectedStyle);
        setGeneratedImage(result.imageUrl);
      } catch (err: any) {
        console.error("Image generation error:", err);
        setError(err?.message || "이미지 생성 중 오류가 발생했습니다.");
        hasGeneratedRef.current = false; // 에러 시 다시 시도 가능하도록
      } finally {
        setIsGenerating(false);
      }
    };

    createImage();
  }, [introduction, selectedStyle]);

  const handleDownload = async () => {
    if (!captureRef.current) return;

    setIsDownloading(true);
    try {
      const element = captureRef.current;
      const platform = detectPlatform();

      // 원본 요소의 텍스트 스타일 가져오기
      const originalTextElement = element.querySelector("p") as HTMLElement;

      // 원본 요소의 인라인 스타일에서 직접 값 가져오기 (computed style보다 정확함)
      const originalLetterSpacing =
        originalTextElement?.style?.letterSpacing || "0.02em";
      const originalLineHeight =
        originalTextElement?.style?.lineHeight || "2.8";
      const originalFontSize = originalTextElement?.style?.fontSize || "18px";
      const originalFontFamily =
        originalTextElement?.style?.fontFamily ||
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

      const canvas = await html2canvas(element, {
        backgroundColor: "#FFF9E6",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (_clonedDoc, clonedElement) => {
          // 클론된 문서에서 텍스트 스타일 강제 적용
          const textElements = clonedElement.querySelectorAll("p");
          textElements.forEach((p) => {
            const style = (p as HTMLElement).style;
            // 원본 인라인 스타일에서 직접 가져온 값 사용 (computed style 대신)
            style.lineHeight = originalLineHeight;
            style.letterSpacing = originalLetterSpacing;
            style.fontSize = originalFontSize;
            style.fontFamily = originalFontFamily;
            style.whiteSpace = "pre-line";
            style.paddingTop = "8px";
            style.paddingBottom = "8px";
            style.margin = "0";
            style.wordBreak = "break-word";
            style.width = "100%";
            // 중요: 스타일이 적용되도록 강제
            style.setProperty("line-height", style.lineHeight, "important");
            style.setProperty(
              "letter-spacing",
              style.letterSpacing,
              "important"
            );
          });
        },
      });

      const url = canvas.toDataURL("image/png", 1.0);

      // Flutter InAppWebView 지원 (iOS/Android 모두)
      if ((window as any).flutter_inappwebview?.callHandler) {
        try {
          // base64 데이터만 추출 (data:image/png;base64, 제거)
          const base64 = url.split(",")[1];
          await (window as any).flutter_inappwebview.callHandler(
            "downloadBase64",
            base64,
            "this-is-me.png"
          );
          setIsDownloading(false);
          return;
        } catch (error) {
          console.error("Flutter InAppWebView download error:", error);
          // 에러 발생 시 다음 방법 시도
        }
      }

      // 네이티브 iOS 앱 지원
      if (platform.isIOS && platform.isWebView) {
        // 네이티브 앱에 이미지 데이터 전송 시도
        if ((window as any).webkit?.messageHandlers?.downloadImage) {
          // 네이티브 iOS 앱의 downloadImage 핸들러 호출
          (window as any).webkit.messageHandlers.downloadImage.postMessage({
            imageData: url,
            filename: "this-is-me.png",
          });
          setIsDownloading(false);
          return;
        }

        // 네이티브 핸들러가 없으면 공유 기능 사용
        if (navigator.share) {
          // Blob으로 변환
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], "this-is-me.png", {
            type: "image/png",
          });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "This Is Me",
              text: "My character image",
            });
            setIsDownloading(false);
            return;
          }
        }

        // 공유 기능도 없으면 새 창에서 열기 (사용자가 수동으로 저장)
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(
            `<html><head><title>This Is Me</title></head><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;"><img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="This Is Me" /><script>setTimeout(() => { alert('이미지를 길게 눌러 저장하세요'); }, 500);</script></body></html>`
          );
        }
        setIsDownloading(false);
        return;
      }

      // 일반 브라우저 (데스크톱/안드로이드) 다운로드
      const link = document.createElement("a");
      link.download = "this-is-me.png";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlayAgain = () => {
    navigate("/");
  };

  if (!userInfo || !introduction || !selectedStyle) {
    return (
      <div className="w-[1280px] h-[800px] bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            결과 정보가 없습니다. 처음부터 시작해주세요.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[1280px] h-[800px] flex flex-col overflow-hidden px-4 py-6"
      style={{
        background:
          "linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)",
      }}
    >
      <div className="w-full mx-auto flex-1 flex flex-col">
        {/* 타이틀 */}
        <h1 className="text-5xl md:text-6xl font-bold text-black text-center py-4 font-serif flex-shrink-0 drop-shadow-md">
          THIS IS ME!
        </h1>

        {/* 결과 표시 화면 (캡처 대상) */}
        <div
          ref={captureRef}
          className="flex-1 min-h-0 mb-4 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px",
          }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center">
              {/* 재미있는 애니메이션 */}
              <div className="relative mb-6">
                {/* 회전하는 별들 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="text-6xl animate-spin"
                    style={{ animationDuration: "2s" }}
                  >
                    ⭐
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="text-5xl animate-spin"
                    style={{
                      animationDuration: "1.5s",
                      animationDirection: "reverse",
                    }}
                  >
                    ✨
                  </div>
                </div>
                {/* 중앙 펄스 애니메이션 */}
                <div className="relative z-10">
                  <div className="text-7xl animate-bounce">🎨</div>
                </div>
                {/* 주변 떠다니는 이모지들 */}
                <div
                  className="absolute -top-4 -left-4 text-4xl animate-bounce"
                  style={{ animationDelay: "0.2s", animationDuration: "1.2s" }}
                >
                  🖌️
                </div>
                <div
                  className="absolute -top-4 -right-4 text-4xl animate-bounce"
                  style={{ animationDelay: "0.4s", animationDuration: "1.3s" }}
                >
                  🎭
                </div>
                <div
                  className="absolute -bottom-4 -left-4 text-4xl animate-bounce"
                  style={{ animationDelay: "0.6s", animationDuration: "1.4s" }}
                >
                  🌈
                </div>
                <div
                  className="absolute -bottom-4 -right-4 text-4xl animate-bounce"
                  style={{ animationDelay: "0.8s", animationDuration: "1.1s" }}
                >
                  🎪
                </div>
              </div>
              <p className="text-orange-600 font-bold text-xl animate-pulse">
                Creating your character...
              </p>
              <p className="text-orange-500 text-sm mt-2">
                Please wait a moment! ✨
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "24px",
                width: "100%",
                maxWidth: "1100px",
                alignItems: "stretch",
              }}
            >
              {/* 왼쪽 패널: 생성된 이미지 */}
              <div
                style={{
                  flex: "0 0 450px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "450px",
                }}
              >
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "420px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                      🎨
                    </div>
                    <p>이미지를 불러오는 중...</p>
                  </div>
                )}
              </div>

              {/* 오른쪽 패널: 자기소개 텍스트 */}
              <div
                style={{
                  flex: "1 1 auto",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  minHeight: "450px",
                  overflow: "auto",
                }}
              >
                <p
                  style={{
                    fontSize: "18px",
                    lineHeight: "2.8",
                    color: "#1f2937",
                    margin: 0,
                    padding: "8px 0",
                    wordBreak: "break-word",
                    whiteSpace: "pre-line",
                    width: "100%",
                    letterSpacing: "0.02em",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                  }}
                >
                  {introduction}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        {generatedImage && !isGenerating && (
          <div className="flex justify-center gap-4 pt-4 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none flex items-center gap-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
            <button
              onClick={handlePlayAgain}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
