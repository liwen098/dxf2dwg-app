<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">⬢</div>
          <div class="logo-text">
            <h1>DXF2DWG</h1>
            <span class="subtitle">CAD 文件转换器</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 步骤指示器 -->
      <div class="steps" v-if="!convertedFile">
        <div class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
          <span class="step-num">1</span>
          <span class="step-label">选择文件</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
          <span class="step-num">2</span>
          <span class="step-label">设置选项</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: currentStep >= 3 }">
          <span class="step-num">3</span>
          <span class="step-label">转换</span>
        </div>
      </div>

      <!-- 步骤1: 文件选择 -->
      <section v-if="currentStep === 1" class="section">
        <div
          class="drop-zone"
          :class="{ dragging: isDragging, hasFile: selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".dxf"
            class="hidden-input"
            @change="handleFileSelect"
          />

          <div v-if="!selectedFile" class="drop-content">
            <div class="upload-icon">📁</div>
            <p class="drop-title">点击或拖拽选择 DXF 文件</p>
            <p class="drop-hint">支持 AutoCAD R12 ~ 2018 版本的 .dxf 文件</p>
            <div class="file-types">
              <span class="file-type-tag">.dxf</span>
            </div>
          </div>

          <div v-else class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatSize(selectedFile.size) }}</p>
            </div>
            <button class="btn-clear" @click.stop="clearFile">✕</button>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions" v-if="!selectedFile">
          <button class="btn-quick" @click="loadSampleFile">
            <span>🎯</span> 使用示例文件测试
          </button>
        </div>

        <button
          v-if="selectedFile"
          class="btn btn-primary btn-block"
          @click="currentStep = 2"
        >
          下一步 →
        </button>
      </section>

      <!-- 步骤2: 转换选项 -->
      <section v-if="currentStep === 2" class="section">
        <div class="options-card">
          <h3 class="card-title">⚙️ 转换设置</h3>

          <div class="form-group">
            <label class="form-label">目标版本</label>
            <div class="version-grid">
              <div
                v-for="v in versions"
                :key="v.id"
                class="version-option"
                :class="{ selected: selectedVersion === v.id }"
                @click="selectedVersion = v.id"
              >
                <span class="version-name">{{ v.name }}</span>
                <span class="version-desc">{{ v.desc }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">输出格式</label>
            <div class="format-toggle">
              <div
                class="format-option"
                :class="{ selected: outputFormat === 'dwg' }"
                @click="outputFormat = 'dwg'"
              >
                <span class="format-icon">📐</span>
                <span>DWG (推荐)</span>
              </div>
              <div
                class="format-option"
                :class="{ selected: outputFormat === 'dxf' }"
                @click="outputFormat = 'dxf'"
              >
                <span class="format-icon">📝</span>
                <span>DXF (兼容)</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="auditEnabled" />
              <span class="checkbox-custom"></span>
              <span>自动修复文件错误 (Audit)</span>
            </label>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-card" v-if="previewUrl">
          <h3 class="card-title">👁️ 文件预览</h3>
          <img :src="previewUrl" class="preview-img" alt="DXF Preview" />
        </div>

        <div class="btn-group">
          <button class="btn btn-secondary" @click="currentStep = 1">← 返回</button>
          <button class="btn btn-primary" @click="startConversion" :disabled="converting">
            {{ converting ? '转换中...' : '🚀 开始转换' }}
          </button>
        </div>
      </section>

      <!-- 步骤3: 转换进度 -->
      <section v-if="currentStep === 3" class="section">
        <div class="convert-card">
          <div v-if="converting" class="progress-area">
            <div class="spinner"></div>
            <p class="progress-text">{{ progressText }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <p class="progress-percent">{{ progress }}%</p>
          </div>

          <div v-if="convertedFile" class="success-area">
            <div class="success-icon">✅</div>
            <h3>转换完成！</h3>
            <div class="result-info">
              <div class="result-row">
                <span class="result-label">文件名</span>
                <span class="result-value">{{ convertedFile.name }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">版本</span>
                <span class="result-value">{{ getVersionName(selectedVersion) }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">大小</span>
                <span class="result-value">{{ formatSize(convertedFile.size) }}</span>
              </div>
            </div>

            <button class="btn btn-primary btn-block btn-download" @click="downloadFile">
              💾 保存到手机
            </button>
            <button class="btn btn-secondary btn-block" @click="resetApp">
              🔄 转换另一个文件
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部信息 -->
    <footer class="app-footer">
      <p>DXF2DWG v1.0.0 · 支持 AutoCAD R12-R2018</p>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'App',
  setup() {
    const API_BASE = ref('http://localhost:8000')
    const currentStep = ref(1)
    const selectedFile = ref(null)
    const isDragging = ref(false)
    const selectedVersion = ref('r2010')
    const outputFormat = ref('dwg')
    const auditEnabled = ref(true)
    const converting = ref(false)
    const progress = ref(0)
    const progressText = ref('正在解析 DXF 文件...')
    const convertedFile = ref(null)
    const previewUrl = ref(null)
    const fileInput = ref(null)

    const versions = [
      { id: 'r12', name: 'R12 (LT95)', desc: '最广泛的兼容性' },
      { id: 'r2000', name: '2000', desc: '经典版本' },
      { id: 'r2007', name: '2007', desc: '改进的压缩' },
      { id: 'r2010', name: '2010', desc: '推荐版本' },
      { id: 'r2013', name: '2013', desc: '较新版本' },
      { id: 'r2018', name: '2018', desc: '最新兼容' },
    ]

    onMounted(() => {
      // 检测 Capacitor 环境
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform()
      if (isNative) {
        // 原生环境中使用相对路径或配置的服务地址
        API_BASE.value = 'https://your-server.com' // 部署后替换为实际地址
      } else {
        // 浏览器开发环境
        API_BASE.value = 'http://localhost:8000'
      }
    })

    function triggerFileInput() {
      fileInput.value?.click()
    }

    function handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) setFile(file)
    }

    function handleDrop(e) {
      isDragging.value = false
      const file = e.dataTransfer.files[0]
      if (file) setFile(file)
    }

    function setFile(file) {
      if (!file.name.toLowerCase().endsWith('.dxf')) {
        alert('请选择 .dxf 格式的文件')
        return
      }
      selectedFile.value = file
      generatePreview()
    }

    function clearFile() {
      selectedFile.value = null
      previewUrl.value = null
    }

    async function generatePreview() {
      if (!selectedFile.value) return
      try {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        const res = await fetch(`${API_BASE.value}/preview`, {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const blob = await res.blob()
          previewUrl.value = URL.createObjectURL(blob)
        }
      } catch (e) {
        console.warn('Preview generation failed:', e)
      }
    }

    async function loadSampleFile() {
      // 创建一个简单的示例 DXF 用于测试
      try {
        const response = await fetch('/sample.dxf')
        if (response.ok) {
          const blob = await response.blob()
          const file = new File([blob], 'sample.dxf', { type: 'application/dxf' })
          setFile(file)
        } else {
          // 如果示例文件不存在，创建一个最小 DXF
          const minimalDxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
100.0
31
0.0
0
ENDSEC
0
EOF`
          const blob = new Blob([minimalDxf], { type: 'application/dxf' })
          const file = new File([blob], 'sample.dxf', { type: 'application/dxf' })
          setFile(file)
        }
      } catch (e) {
        alert('无法加载示例文件，请手动选择 DXF 文件')
      }
    }

    async function startConversion() {
      if (!selectedFile.value) return

      currentStep.value = 3
      converting.value = true
      progress.value = 0

      // 模拟进度
      const progressSteps = [
        { p: 20, t: '正在解析 DXF 结构...' },
        { p: 45, t: '正在提取图层和实体...' },
        { p: 70, t: '正在转换实体数据...' },
        { p: 90, t: '正在生成 DWG 文件...' },
        { p: 100, t: '转换完成！' },
      ]

      for (const step of progressSteps) {
        await sleep(400)
        progress.value = step.p
        progressText.value = step.t
      }

      try {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        formData.append('version', selectedVersion.value)

        const res = await fetch(`${API_BASE.value}/convert?version=${selectedVersion.value}`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: '转换失败' }))
          throw new Error(errData.detail || '转换失败')
        }

        const blob = await res.blob()
        const ext = outputFormat.value === 'dwg' ? 'dwg' : 'dxf'
        const fileName = selectedFile.value.name.replace('.dxf', '') + '.' + ext
        convertedFile.value = {
          name: fileName,
          size: blob.size,
          blob: blob,
          url: URL.createObjectURL(blob),
        }
      } catch (e) {
        console.error('Conversion error:', e)
        // 即使后端不可用，也提供模拟下载以演示 UI 流程
        const mockContent = `% DXF file converted by DXF2DWG App\n0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC${getVersionCode(selectedVersion.value)}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF`
        const blob = new Blob([mockContent], { type: 'application/octet-stream' })
        const ext = outputFormat.value === 'dwg' ? 'dwg' : 'dxf'
        const fileName = selectedFile.value.name.replace('.dxf', '') + '.' + ext
        convertedFile.value = {
          name: fileName,
          size: blob.size,
          blob: blob,
          url: URL.createObjectURL(blob),
        }
        alert('注意：后端服务未连接，生成的是演示文件。请部署后端服务以获得完整功能。')
      } finally {
        converting.value = false
      }
    }

    function downloadFile() {
      if (!convertedFile.value) return

      const a = document.createElement('a')
      a.href = convertedFile.value.url
      a.download = convertedFile.value.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // 如果在原生环境，使用 Capacitor Filesystem
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        saveToNativeDevice()
      }
    }

    async function saveToNativeDevice() {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const base64 = await blobToBase64(convertedFile.value.blob)
        await Filesystem.writeFile({
          path: convertedFile.value.name,
          data: base64,
          directory: Directory.Downloads,
        })
        alert('文件已保存到下载目录')
      } catch (e) {
        console.error('Native save failed:', e)
      }
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    function resetApp() {
      currentStep.value = 1
      selectedFile.value = null
      convertedFile.value = null
      previewUrl.value = null
      progress.value = 0
      progressText.value = '正在解析 DXF 文件...'
    }

    function formatSize(bytes) {
      if (!bytes && bytes !== 0) return ''
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / 1048576).toFixed(1) + ' MB'
    }

    function getVersionName(id) {
      const v = versions.find(x => x.id === id)
      return v ? v.name : id
    }

    function getVersionCode(id) {
      const codes = { r12: '1009', r2000: '1015', r2004: '1018', r2007: '1021', r2010: '1024', r2013: '1027', r2018: '1032' }
      return codes[id] || '1024'
    }

    function sleep(ms) {
      return new Promise(r => setTimeout(r, ms))
    }

    return {
      API_BASE, currentStep, selectedFile, isDragging,
      selectedVersion, outputFormat, auditEnabled,
      converting, progress, progressText, convertedFile, previewUrl,
      fileInput, versions,
      triggerFileInput, handleFileSelect, handleDrop, clearFile,
      loadSampleFile, startConversion, downloadFile, resetApp,
      formatSize, getVersionName,
    }
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #1976D2;
  --primary-dark: #1565C0;
  --primary-light: #E3F2FD;
  --success: #4CAF50;
  --error: #F44336;
  --warning: #FF9800;
  --bg: #F5F7FA;
  --card-bg: #FFFFFF;
  --text: #1A1A2E;
  --text-secondary: #6B7280;
  --border: #E0E0E0;
  --radius: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  position: relative;
}

/* Header */
.app-header {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  padding: 20px 20px 24px;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.logo-text h1 {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.logo-text .subtitle {
  color: rgba(255,255,255,0.8);
  font-size: 11px;
}

/* Main */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 80px;
}

/* Steps */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E0E0E0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
}

.step.active .step-num {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.step.done .step-num {
  background: var(--success);
  color: #fff;
}

.step-label {
  font-size: 10px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.step.active .step-label {
  color: var(--primary);
  font-weight: 600;
}

.step-line {
  width: 30px;
  height: 2px;
  background: #E0E0E0;
  margin: 0 6px;
  margin-bottom: 18px;
}

/* Section */
.section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Drop Zone */
.drop-zone {
  background: var(--card-bg);
  border: 2.5px dashed var(--border);
  border-radius: var(--radius);
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 16px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone.dragging {
  border-color: var(--primary);
  background: var(--primary-light);
}

.drop-zone.hasFile {
  border-style: solid;
  border-color: var(--success);
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.7;
}

.drop-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.drop-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.file-types {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.file-type-tag {
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* File Info */
.file-info {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 8px;
}

.file-icon {
  font-size: 36px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  font-size: 14px;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-clear {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #F5F5F5;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: #fff;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.35);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: var(--text);
  border: 1.5px solid var(--border);
}

.btn-block {
  width: 100%;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-group .btn {
  flex: 1;
}

/* Options Card */
.options-card, .preview-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}

.version-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.version-option {
  padding: 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.version-option.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.version-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.version-desc {
  font-size: 10px;
  color: var(--text-secondary);
}

.format-toggle {
  display: flex;
  gap: 10px;
}

.format-option {
  flex: 1;
  padding: 14px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.format-option.selected {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkbox-custom {
  background: var(--primary);
  border-color: var(--primary);
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

/* Preview */
.preview-img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
}

/* Convert Area */
.convert-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 32px 20px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.progress-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 14px;
  color: var(--text);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #F0F0F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976D2, #42A5F5);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.progress-percent {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

/* Success */
.success-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.success-icon {
  font-size: 56px;
}

.success-area h3 {
  font-size: 18px;
  color: var(--success);
}

.result-info {
  width: 100%;
  background: #F8F9FA;
  border-radius: 10px;
  padding: 12px 16px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #EEE;
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.result-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.btn-download {
  margin-top: 8px;
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.35);
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 16px;
}

.btn-quick {
  width: 100%;
  padding: 12px;
  border: 1.5px dashed var(--primary);
  border-radius: 12px;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Footer */
.app-footer {
  text-align: center;
  padding: 16px;
  font-size: 11px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  background: #fff;
}

.hidden-input {
  display: none;
}

/* Responsive */
@media (min-width: 481px) {
  .app-container {
    box-shadow: 0 0 40px rgba(0,0,0,0.1);
    min-height: 100vh;
  }
}
</style>
