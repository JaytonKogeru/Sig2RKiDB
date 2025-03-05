from flask import Flask, request, jsonify, render_template
import pickle

from rdkit import Chem
from rdkit.Chem.rdFingerprintGenerator import GetMorganGenerator
from rdkit.Chem import Draw
from rdkit.Chem import AllChem

import numpy as np
import os
import base64
from io import BytesIO


# 输出当前工作目录，便于调试
print("Current working directory:", os.getcwd())

app = Flask(__name__)

# 使用 os.path.join 构造模型文件的正确路径
model_path = os.path.join("model", "qsar_model.pkl")
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
except Exception as e:
    print("模型加载失败，请检查 qsar_model.pkl 文件及其路径", e)
    model = None

def calculate_descriptors(smiles):
    """
    根据 SMILES 计算 Morgan 指纹作为分子描述符。
    使用 radius=3 和 fpSize=1024，确保与训练模型时的设置一致。
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    generator = GetMorganGenerator(radius=3, fpSize=1024)
    fp = generator.GetFingerprint(mol)
    # 转换为列表作为模型的输入
    return list(fp)

@app.route('/')
def index():
    # 使用 render_template 渲染 templates/index.html
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """
    接收前端提交的 SMILES 字符串，
    计算 Morgan 指纹描述符，调用 QSAR 模型预测 pKi 值，
    并返回 JSON 格式的预测结果。
    """
    data = request.get_json()
    if not data or 'smiles' not in data:
        return jsonify({'error': 'Lack of SMILES Data'}), 400
    
    smiles = data.get('smiles')
    descriptors = calculate_descriptors(smiles)
    
    if descriptors is None:
        return jsonify({'error': 'Invalid SMILES Strings'}), 400
    
    try:
        # 模型的输入需要是二维数组形式
        pki = model.predict([descriptors])[0]
        ki = 10 ** (9 - pki)
        
    except Exception as e:
        return jsonify({'error': f'Prediction Error：{str(e)}'}), 500
    
    return jsonify({'pKi': pki, 'Ki': ki})

@app.route('/render', methods=['POST'])
def render_molecule():
    data = request.get_json()
    smiles = data.get('smiles', None)
    if not smiles:
        return jsonify({'error': 'No SMILES provided'}), 400

    # 尝试生成分子对象
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return jsonify({'error': 'Invalid SMILES string'}), 400

    # 生成 2D 坐标（可选，但推荐）
    AllChem.Compute2DCoords(mol)

    # 生成图片（这里设置图片尺寸为300x300）
    img = Draw.MolToImage(mol, size=(300, 300))
    
    # 将图片保存到 BytesIO 中，并转换为 Base64 字符串
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.read()).decode('utf-8')

    return jsonify({'image': img_str})




if __name__ == '__main__':
    if model is None:
        print("无法启动服务：模型未加载")
    else:
        app.run(debug=True)
