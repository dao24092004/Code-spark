# CodeSpark JVM Tuning 配置指南

## 概述

本文档描述了 CodeSpark 微服务平台的 JVM 调优配置，包括内存设置、GC 选择和容器资源限制。

## 快速开始

### 启动所有服务（JVM 已调优）

```bash
# 方式1：直接使用 docker-compose（需要手动添加环境变量）
docker-compose up -d

# 方式2：使用 JVM 调优覆盖文件
docker-compose -f docker-compose.yml -f docker-compose.jvm-tuning.yml up -d

# 方式3：后台运行并查看日志
docker-compose -f docker-compose.yml -f docker-compose.jvm-tuning.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.jvm-tuning.yml logs -f
```

## JVM 配置摘要

| 服务 | Xms | Xmx | 容器限制 | GC | 优先级 |
|------|-----|-----|----------|-----|--------|
| discovery-service | 256m | 384m | 512m | ZGC | 低 |
| config-server | 256m | 384m | 512m | ZGC | 低 |
| api-gateway | 384m | 512m | 768m | ZGC | 高 |
| identity-service | 512m | 1024m | 1536m | ZGC | 关键 |
| user-service | 384m | 512m | 768m | ZGC | 中 |
| profile-service | 512m | 768m | 1024m | ZGC | 高 |
| course-service | 512m | 1024m | 1536m | ZGC | 高 |
| exam-service | 768m | 1536m | 2048m | ZGC | 最高 |
| file-service | 384m | 512m | 768m | ZGC | 中 |
| notification-service | 256m | 384m | 512m | ZGC | 低 |
| analytics-service | 512m | 768m | 1024m | ZGC | 中 |
| admin-service | 256m | 384m | 512m | ZGC | 低 |

**总计需求**：约 **10GB** RAM

## JVM 参数说明

### ZGC（Z Garbage Collector）

ZGC 是 CodeSpark 选择的垃圾收集器，原因如下：

- **低延迟**：最大 GC 暂停时间控制在 100ms 以内（exam-service 200ms）
- **高吞吐量**：与 G1GC 相比，吞吐量相当但延迟更低
- **大堆支持**：能够处理大内存堆（最高 1536m）
- **并发执行**：大部分 GC 工作与应用程序并发执行

### JVM 参数详解

```
-Xms{initial}m           # 初始堆大小
-Xmx{maximum}m           # 最大堆大小
-XX:+UseZGC              # 启用 ZGC
-XX:MaxGCPauseMillis=100 # 最大 GC 暂停时间目标（毫秒）
-XX:+HeapDumpOnOutOfMemoryError  # OOM 时自动生成堆转储
-XX:HeapDumpPath=/var/log/heapdump.hprof  # 堆转储文件路径
-Djava.security.egd=file:/dev/./urandom  # 加速随机数生成
```

### 服务特定参数

#### exam-service（最重服务）
```bash
-Xms768m -Xmx1536m \
-XX:+UseZGC -XX:MaxGCPauseMillis=200 \
-Dspring.kafka.consumer.max-poll-records=100 \
-Dspring.ai.openai.timeout=120s \
-Dspring.jpa.open-in-view=false
```

#### identity-service（关键安全服务）
```bash
-Xms512m -Xmx1024m \
-XX:+UseZGC -XX:MaxGCPauseMillis=100 \
-Dspring.session.store-type=redis \
-Dspring.data.redis.timeout=5000
```

## 监控

### Prometheus Metrics

所有服务都暴露了 `/actuator/prometheus` 端点。已更新 `prometheus.yml` 配置所有服务的抓取。

### 关键监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| `jvm_memory_used_bytes{area="heap"}` | 已使用堆内存 | > 80% Xmx |
| `jvm_gc_pause_seconds_sum` | GC 暂停总时间 | 持续增长 |
| `jvm_gc_pause_seconds_count` | GC 暂停次数 | > 10次/分钟 |
| `process_memory_rss_bytes` | 容器实际内存使用 | > 容器限制 |

### 访问监控工具

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (默认账号: admin/admin)

## Grafana Dashboard

建议导入以下 Dashboard 进行 JVM 监控：

1. **JVM (Micrometer)** - ID: 15991
2. **Spring Boot APM** - ID: 15146
3. **Docker Monitoring** - ID: 17913

## 故障排查

### 内存不足 (OOM)

1. 检查容器日志：
   ```bash
   docker logs exam-service | tail -100
   ```

2. 检查堆转储文件：
   ```bash
   docker exec exam-service ls -la /var/log/
   docker cp exam-service:/var/log/heapdump.hprof ./heapdump.hprof
   ```

3. 使用 Eclipse MAT 分析堆转储：
   ```bash
   # 本地分析（需要安装 MAT）
   mat.sh heapdump.hprof
   ```

### GC 问题

1. 检查 GC 日志：
   ```bash
   docker exec exam-service jstat -gcutil 1 1000
   ```

2. 启用详细 GC 日志：
   ```yaml
   # 在 docker-compose.jvm-tuning.yml 中添加
   environment:
     - JAVA_OPTS: "... -Xlog:gc*:file=/var/log/gc.log:time:filecount=5,filesize=10m"
   ```

### 性能调优

如果发现性能问题，可以：

1. **增加堆大小**：编辑 `docker-compose.jvm-tuning.yml`
2. **调整 ZGC 参数**：增加 `-XX:MaxGCPauseMillis`
3. **启用类数据共享**：
   ```bash
   -XX:+UseClassUnloadingWithConcurrentMark
   ```

## 文件结构

```
Code-spark/
├── docker-compose.yml                    # 基础配置
├── docker-compose.jvm-tuning.yml        # JVM 调优覆盖配置
├── services/
│   ├── discovery-service/
│   │   └── Dockerfile                   # 已更新 JVM 参数
│   ├── config-server/
│   │   └── Dockerfile
│   ├── api-gateway/
│   │   └── Dockerfile
│   ├── identity-service/
│   │   └── Dockerfile
│   ├── user-service/
│   │   └── Dockerfile
│   ├── profile-service/
│   │   └── Dockerfile
│   ├── course-service/
│   │   └── Dockerfile
│   ├── exam-service/
│   │   └── Dockerfile
│   ├── file-service/
│   │   └── Dockerfile
│   ├── notification-service/
│   │   └── Dockerfile
│   ├── analytics-service/
│   │   └── Dockerfile
│   └── admin-service/
│       └── Dockerfile
├── infra/
│   └── prometheus/
│       └── prometheus.yml               # 已更新所有服务监控
└── pom.xml                              # 父 POM，JVM 属性定义
```

## 最佳实践

1. **永远不要设置比容器限制更高的 Xmx**
2. **使用 ZGC 获得更好的响应时间**
3. **保留至少 20% 的容器限制给非堆内存**
4. **生产环境使用 `-XX:+HeapDumpOnOutOfMemoryError`**
5. **监控 `process_memory_rss_bytes` 而非仅 `jvm_memory_used_bytes`**

## 未来优化方向

- [ ] 考虑使用 GraalVM Native Image（需要 WebAuthn 配置）
- [ ] 根据实际负载动态调整内存
- [ ] 使用 Java Flight Recorder (JFR) 进行生产诊断
- [ ] 实施自动缩放基于 JVM 内存使用率
