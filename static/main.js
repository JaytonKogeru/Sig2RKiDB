// ------------------
// 1. 页面导航和平滑滚动代码（保持不变）
// ------------------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    this.classList.add('active');
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });
    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
document.getElementById('home').classList.add('active');


// ------------------
// 2. 合并后的 Predict & Render 逻辑
// ------------------
document.getElementById('predict-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // 1) 获取用户输入的 SMILES
  const smiles = document.getElementById('smiles').value.trim();

  // 2) 隐藏结构容器（等生成后再显示）
  const structureContainer = document.getElementById('structure-container');
  structureContainer.classList.add('hidden');   // 需要在 CSS 中定义 .hidden { display: none; }
  document.getElementById('structure-img').src = ""; // 清空之前的图片

  // 3) 调用 /predict 接口
  fetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles: smiles })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      document.getElementById('prediction-result').innerHTML = 'Error: ' + data.error;
    } else {
      const formattedKi = formatToPowerNotation(data.Ki, 3);
      // 显示预测结果
      document.getElementById('prediction-result').innerHTML = 
      `<div><strong>Predicted pKi:</strong> ${data.pKi.toFixed(2)}</div>
      <div><strong>Predicted Ki:</strong> ${formattedKi}</div>`;
    }
  })
  .catch(error => {
    console.error('Predict Error:', error);
    document.getElementById('prediction-result').textContent = 'Request error, please retry.';
  });

  // 4) 调用 /render 接口
  fetch('/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles: smiles })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error('Render Error:', data.error);
      document.getElementById('structure-img').src = "";
    } else {
      // 显示分子结构
      document.getElementById('structure-img').src = 'data:image/png;base64,' + data.image;
      // 移除 hidden 类，让容器可见
      structureContainer.classList.remove('hidden');
    }
  })
  .catch(error => {
    console.error('Render Error:', error);
  });
});


function formatToPowerNotation(value, decimals = 3) {
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = (value / Math.pow(10, exponent)).toFixed(decimals);
  return `${mantissa} × 10^${exponent}`;
}
