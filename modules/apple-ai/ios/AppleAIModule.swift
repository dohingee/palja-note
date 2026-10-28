import ExpoModulesCore
import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

// 팔자노트 전용 로컬 Expo 모듈.
// 애플 Foundation Models(iOS 26+, Apple Intelligence 켠 기기)로 미리 쓴 풀이를 다시 쓴다.
// iOS 26 미만이거나 FoundationModels가 없는 SDK로 빌드하면 "osTooOld"를 돌려주고, rewrite는 예외를 던진다.
// (JS 쪽 src/ai/api.ts가 모든 예외를 잡아 null로 바꾼다.)
public class AppleAIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleAI")

    // "available" | "deviceNotEligible" | "appleIntelligenceNotEnabled" | "modelNotReady"
    // | "languageNotSupported" | "osTooOld" | "unknown"
    Function("availability") { () -> String in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        return AppleAIRewriter.availability()
      }
      #endif
      return "osTooOld"
    }

    // instructions: 모델의 역할·규칙, prompt: 다시 쓸 원문. 결과는 headline/body/advice 세 칸.
    AsyncFunction("rewrite") { (instructions: String, prompt: String) async throws -> [String: String] in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        return try await AppleAIRewriter.rewrite(instructions: instructions, prompt: prompt)
      }
      #endif
      throw AppleAIUnavailableException()
    }
  }
}

#if canImport(FoundationModels)
@available(iOS 26.0, *)
enum AppleAIRewriter {
  static func availability() -> String {
    let model = SystemLanguageModel.default
    switch model.availability {
    case .available:
      return model.supportsLocale(Locale(identifier: "ko_KR")) ? "available" : "languageNotSupported"
    case .unavailable(.deviceNotEligible):
      return "deviceNotEligible"
    case .unavailable(.appleIntelligenceNotEnabled):
      return "appleIntelligenceNotEnabled"
    case .unavailable(.modelNotReady):
      return "modelNotReady"
    case .unavailable(_):
      return "unknown"
    }
  }

  // @Generable 매크로 대신 DynamicGenerationSchema로 구조화 출력을 받는다.
  // (배포 대상이 iOS 26보다 낮아서, 매크로가 만드는 코드의 가용성 문제를 피하려는 것)
  static func makeSchema() throws -> GenerationSchema {
    let text = DynamicGenerationSchema(type: String.self)
    let root = DynamicGenerationSchema(
      name: "FortuneRewrite",
      description: "다시 쓴 운세 풀이",
      properties: [
        DynamicGenerationSchema.Property(
          name: "headline",
          description: "한 줄 제목. 25자 이내.",
          schema: text
        ),
        DynamicGenerationSchema.Property(
          name: "body",
          description: "본문. 4문장 안팎의 친근한 존댓말.",
          schema: text
        ),
        DynamicGenerationSchema.Property(
          name: "advice",
          description: "한 문장짜리 가벼운 조언.",
          schema: text
        ),
      ]
    )
    return try GenerationSchema(root: root, dependencies: [])
  }

  static func rewrite(instructions: String, prompt: String) async throws -> [String: String] {
    guard availability() == "available" else {
      throw AppleAIUnavailableException()
    }
    let session = LanguageModelSession(instructions: instructions)
    let options = GenerationOptions(temperature: 0.5, maximumResponseTokens: 700)
    let schema = try makeSchema()
    let response = try await session.respond(
      to: prompt,
      schema: schema,
      includeSchemaInPrompt: true,
      options: options
    )
    let content = response.content
    let headline = try content.value(String.self, forProperty: "headline")
    let body = try content.value(String.self, forProperty: "body")
    let advice = try content.value(String.self, forProperty: "advice")
    return ["headline": headline, "body": body, "advice": advice]
  }
}
#endif

internal class AppleAIUnavailableException: Exception {
  override var reason: String {
    "Apple Foundation Models is not available on this device."
  }
}
