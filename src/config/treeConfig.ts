/**
 * Tree Engine Configuration & Default Parameters
 * Project: Fractal Tree NFC Mobile Game
 * 
 * Nơi lưu trữ các hằng số mặc định có thể tinh chỉnh trước khi build Product.
 */

export const TREE_CONFIG = {
  // Chiều dài cành tối thiểu (pixel) trước khi ngắt nhánh đệ quy
  minBranchLength: 15,

  // Chiều dài thân chính ban đầu tại gốc
  defaultInitLength: 200,

  // Độ dày gốc thân cây mặc định (pixel)
  defaultInitThickness: 36,

  // Tỉ lệ tiêu giảm độ dày thân cành qua các tầng
  defaultThicknessDecay: 0.55,

  // Độ biến thiên hữu cơ (organic asymmetry variation) của cây
  defaultTreeVariation: 0.80,

  // Giới hạn các chỉ số di truyền hạt giống
  maxDepthRange: { min: 8, max: 12 },
  branchAngleRange: { min: 14, max: 34 },
  lengthDecayRange: { min: 0.68, max: 0.86 },
  thicknessDecayRange: { min: 0.48, max: 0.66 },
  initThicknessRange: { min: 24, max: 60 },
  treeVariationRange: { min: 0.50, max: 1.20 }
};
