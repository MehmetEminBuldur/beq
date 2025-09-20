from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="beq-shared-models",
    version="0.1.0",
    author="BeQ Development Team",
    author_email="dev@beq.app",
    description="Shared data models and schemas for Bricks and Quantas (BeQ) project",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(where=".", include=["schemas*"]),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.11",
    install_requires=[
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "typing-extensions>=4.8.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.9.0",
            "isort>=5.12.0",
            "flake8>=6.1.0",
            "mypy>=1.6.0",
        ],
    },
)
